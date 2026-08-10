import { Keyboard, Mic, MicOff, SquareTerminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VoiceControlProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitTurn: (spokenText: string, audioBlob: Blob | null) => Promise<void>;
  suggestedText: string;
  disabled?: boolean;
  currentStepLabel: string;
}

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
};

export function VoiceControl({
  value,
  onChange,
  onSubmitTurn,
  suggestedText,
  disabled = false,
  currentStepLabel,
}: VoiceControlProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoSubmitRef = useRef(false);
  const isStartingRef = useRef(false);
  const stopQueuedRef = useRef(false);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      if (!isRecording && !disabled) {
        void beginRecording();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return;
      }

      event.preventDefault();
      if (isRecording) {
        void endRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, isRecording]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const beginRecording = async () => {
    if (disabled || isRecording || isSending) {
      return;
    }

    setPermissionError(null);
    isStartingRef.current = true;
    stopQueuedRef.current = false;
    hasSubmittedRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setPermissionError('Mic capture is unavailable in this browser. You can still type a phrase and submit it.');
      isStartingRef.current = false;
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      autoSubmitRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (hasSubmittedRef.current) {
          return;
        }

        const blob = chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: 'audio/webm' }) : null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setIsRecording(false);
        isStartingRef.current = false;
        hasSubmittedRef.current = true;

        if (autoSubmitRef.current) {
          setIsSending(true);
          try {
            await onSubmitTurn(value.trim() || suggestedText, blob);
          } finally {
            setIsSending(false);
          }
        }
      };

      recorder.start();
      setIsRecording(true);

      if (stopQueuedRef.current) {
        queueMicrotask(() => {
          recorder.stop();
        });
      }
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : 'Microphone permission was denied.');
      setIsRecording(false);
      isStartingRef.current = false;
    }
  };

  const endRecording = async () => {
    autoSubmitRef.current = true;

    if (!isRecording && !isStartingRef.current && !recorderRef.current) {
      return;
    }

    if (isStartingRef.current && !recorderRef.current) {
      stopQueuedRef.current = true;
      return;
    }

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      return;
    }

    if (!isSending) {
      setIsSending(true);
      try {
        await onSubmitTurn(value.trim() || suggestedText, null);
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <section className="panel panel--stack panel--voice">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Voice control</p>
          <h2>Hold to speak</h2>
        </div>
        {isRecording ? <Mic size={18} className="voice-state voice-state--active" /> : <MicOff size={18} className="voice-state" />}
      </div>

      <label className="voice-input">
        <span className="voice-input__label">Pilot readback for {currentStepLabel}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={suggestedText}
          rows={4}
        />
      </label>

      <div className="voice-actions">
        <button
          type="button"
          className={`voice-button ${isRecording ? 'voice-button--recording' : ''}`}
          onPointerDown={() => {
            void beginRecording();
          }}
          onPointerUp={() => {
            void endRecording();
          }}
          onPointerLeave={() => {
            if (isRecording) {
              void endRecording();
            }
          }}
          disabled={disabled || isSending}
        >
          <SquareTerminal size={18} />
          {isRecording ? 'Release to send' : 'Hold to talk'}
        </button>

        <div className="voice-shortcut">
          <Keyboard size={14} />
          Hold spacebar to record
        </div>
      </div>

      {permissionError ? <p className="voice-error">{permissionError}</p> : null}
      <p className="voice-note">The mock backend uses your readback text to drive the turn, while the audio capture still proves the push-to-talk flow.</p>
    </section>
  );
}
