import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitTurnAPI } from '../service/simulator.api';
import { createSessionAPI, completeSessionAPI, getScenarioByIdAPI } from '../../dashboard/service/dashboard.api';
import {
  setCurrentSession, addTranscriptMessage, setIsRecording,
  setIsProcessing, setIsAgentSpeaking, setAgentAudioLevel, setSimulatorError, setAudioLevel, resetSimulator,
} from '../slice/simulator.slice';

let currentAudioInstance = null;
let currentAnimFrame = null;

export function stopCurrentSpeech() {
  if (currentAnimFrame) {
    cancelAnimationFrame(currentAnimFrame);
    currentAnimFrame = null;
  }
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch (e) {}
    currentAudioInstance = null;
  }
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
}

export function speakLine(text, audioBase64, onEnded, onStart, onAudioLevel) {
  stopCurrentSpeech();

  const handleStart = () => {
    if (onStart) onStart();
  };

  const handleEnded = () => {
    if (currentAnimFrame) {
      cancelAnimationFrame(currentAnimFrame);
      currentAnimFrame = null;
    }
    if (onAudioLevel) onAudioLevel(0);
    if (onEnded) onEnded();
  };

  if (!text && !audioBase64) {
    handleEnded();
    return;
  }

  if (audioBase64) {
    const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
    currentAudioInstance = audio;

    let audioCtx = null;
    let analyser = null;
    let dataArray = null;

    audio.onplay = () => {
      handleStart();
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const source = audioCtx.createMediaElementSource(audio);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch (e) {
        analyser = null;
      }

      const monitorFrequency = () => {
        if (!audio.paused && !audio.ended) {
          let level = 0.5;
          if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((acc, v) => acc + v, 0);
            level = Math.min(1.0, (sum / dataArray.length) / 128);
          } else {
            const t = Date.now() * 0.012;
            level = 0.35 + 0.45 * Math.sin(t) + 0.15 * Math.sin(t * 2.3);
          }
          if (onAudioLevel) onAudioLevel(level);
          currentAnimFrame = requestAnimationFrame(monitorFrequency);
        }
      };
      monitorFrequency();
    };

    audio.onended = handleEnded;
    audio.onerror = () => {
      console.warn('[Simulator] HTML5 Audio playback error, switching to SpeechSynthesis fallback');
      fallbackWebSpeech(text, handleEnded, handleStart, onAudioLevel);
    };

    audio.play().catch((e) => {
      console.warn('[Simulator] Autoplay error, switching to SpeechSynthesis fallback:', e.message);
      fallbackWebSpeech(text, handleEnded, handleStart, onAudioLevel);
    });
  } else {
    fallbackWebSpeech(text, handleEnded, handleStart, onAudioLevel);
  }
}

function fallbackWebSpeech(text, onEnded, onStart, onAudioLevel) {
  if (!('speechSynthesis' in window)) {
    if (onEnded) onEnded();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (e) {}

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Google') || v.name.includes('Samantha'))) || voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
    let count = 0;
    const synthLoop = () => {
      count++;
      const lvl = 0.3 + 0.5 * Math.sin(count * 0.2);
      if (onAudioLevel) onAudioLevel(lvl);
      currentAnimFrame = requestAnimationFrame(synthLoop);
    };
    synthLoop();
  };

  utterance.onend = () => {
    if (currentAnimFrame) {
      cancelAnimationFrame(currentAnimFrame);
      currentAnimFrame = null;
    }
    if (onAudioLevel) onAudioLevel(0);
    if (onEnded) onEnded();
  };

  utterance.onerror = (err) => {
    console.warn('[Simulator] SpeechSynthesis error:', err);
    if (currentAnimFrame) {
      cancelAnimationFrame(currentAnimFrame);
      currentAnimFrame = null;
    }
    if (onAudioLevel) onAudioLevel(0);
    if (onEnded) onEnded();
  };

  window.speechSynthesis.speak(utterance);
}

export const useSimulator = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.simulator);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const scenarioRef = useRef(null);
  const submittingTurnRef = useRef(false);
  const initializingScenarioIdRef = useRef(null);

  // WebSpeech SpeechRecognition Refs for instant local mic transcription
  const speechRecognitionRef = useRef(null);
  const speechTranscriptRef = useRef('');

  const playAgentSpeech = useCallback((text, audioBase64) => {
    dispatch(setIsAgentSpeaking(true));
    dispatch(setAgentAudioLevel(0.6));

    speakLine(
      text,
      audioBase64,
      () => {
        dispatch(setIsAgentSpeaking(false));
        dispatch(setAgentAudioLevel(0));
        dispatch(setIsProcessing(false));
      },
      () => {
        dispatch(setIsAgentSpeaking(true));
      },
      (lvl) => {
        dispatch(setAgentAudioLevel(lvl));
      }
    );
  }, [dispatch]);

  const startSession = useCallback(async (scenarioId) => {
    if (!scenarioId || initializingScenarioIdRef.current === scenarioId) {
      return;
    }

    initializingScenarioIdRef.current = scenarioId;
    stopCurrentSpeech();

    try {
      dispatch(resetSimulator());
      dispatch(setIsProcessing(true));

      // 1. Fetch full scenario details
      let scenario = null;
      try {
        const scRes = await getScenarioByIdAPI(scenarioId);
        scenario = scRes?.data?.scenario || scRes?.scenario;
      } catch (e) {
        console.warn('[Simulator] Using fallback scenario context:', e.message);
      }

      scenarioRef.current = scenario;

      // 2. Create session in Backend
      let session = null;
      try {
        const sessRes = await createSessionAPI(scenarioId);
        session = sessRes?.data?.session || sessRes?.session;
      } catch (e) {
        console.warn('[Simulator] Backend session fallback mode:', e.message);
        session = { _id: 'sim_session_' + Date.now(), scenarioId };
      }

      dispatch(setCurrentSession(session));

      // 3. Initiate first turn with AI service to get initial ATC transmission
      if (session) {
        try {
          const turnRes = await submitTurnAPI(session._id || session.id, {
            scenarioContext: scenario,
          });

          const turnData = turnRes?.data || turnRes;

          if (turnData?.currentLine) {
            dispatch(addTranscriptMessage({
              role: 'atc',
              text: turnData.currentLine,
              timestamp: new Date().toISOString(),
            }));
            playAgentSpeech(turnData.currentLine, turnData.audioBase64);
          } else {
            dispatch(setIsProcessing(false));
          }
        } catch (e) {
          console.warn('[Simulator] Initial turn call warning:', e.message);
          dispatch(setIsProcessing(false));
        }
      } else {
        dispatch(setIsProcessing(false));
      }
    } catch (err) {
      dispatch(setSimulatorError(err.message));
      dispatch(setIsProcessing(false));
    } finally {
      initializingScenarioIdRef.current = null;
    }
  }, [dispatch, playAgentSpeech]);

  // Begin microphone recording with live audio level monitoring & local SpeechRecognition
  const startRecording = useCallback(async () => {
    if (state.isProcessing || state.isRecording) {
      console.warn('[Simulator] Mic blocked: ATC model is currently speaking or processing');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup analyser for frequency visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Poll audio level for orb reactivity
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const pollLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        dispatch(setAudioLevel(avg / 255));
        animFrameRef.current = requestAnimationFrame(pollLevel);
      };
      pollLevel();

      // Setup browser WebSpeech SpeechRecognition for instant local transcript capture
      speechTranscriptRef.current = '';
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript && transcript.trim()) {
              speechTranscriptRef.current = transcript.trim();
            }
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (srErr) {
          console.warn('[Simulator] SpeechRecognition init warning:', srErr.message);
        }
      }

      // Setup MediaRecorder
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(50); // Record chunks every 50ms for maximum capture
      dispatch(setIsRecording(true));
    } catch (err) {
      dispatch(setSimulatorError('Microphone access denied: ' + err.message));
    }
  }, [dispatch, state.isProcessing, state.isRecording]);

  // Stop recording and submit audio + local transcript to AI service safely
  const stopRecordingAndSubmit = useCallback(async () => {
    if (!mediaRecorderRef.current || submittingTurnRef.current) {
      dispatch(setIsRecording(false));
      return null;
    }

    submittingTurnRef.current = true;
    const sessionId = state.currentSession?._id || state.currentSession?.id || 'sim_session_' + Date.now();

    // Stop SpeechRecognition if active
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    return new Promise((resolve) => {
      const handleStop = async () => {
        // Cleanup audio monitoring & AudioContext
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        analyserRef.current = null;
        if (audioCtxRef.current) {
          try {
            await audioCtxRef.current.close();
          } catch (e) {}
          audioCtxRef.current = null;
        }

        dispatch(setAudioLevel(0));
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const localTranscript = speechTranscriptRef.current;
        
        dispatch(setIsRecording(false));

        if (audioBlob.size < 10 && !localTranscript) {
          console.warn('[Simulator] Audio recording was empty or too brief');
          submittingTurnRef.current = false;
          resolve(null);
          return;
        }

        dispatch(setIsProcessing(true));

        try {
          const turnRes = await submitTurnAPI(sessionId, {
            audioBlob,
            pilotTranscript: localTranscript || undefined,
            scenarioContext: scenarioRef.current,
          });

          const data = turnRes?.data || turnRes;

          // Add Pilot transcript if recognized
          if (data?.pilotTranscript) {
            dispatch(addTranscriptMessage({
              role: 'pilot',
              text: data.pilotTranscript,
              timestamp: new Date().toISOString(),
            }));
          } else if (localTranscript) {
            dispatch(addTranscriptMessage({
              role: 'pilot',
              text: localTranscript,
              timestamp: new Date().toISOString(),
            }));
          }

          // Add ATC AI response
          if (data?.currentLine) {
            dispatch(addTranscriptMessage({
              role: 'atc',
              text: data.currentLine,
              timestamp: new Date().toISOString(),
            }));

            // Play AI audio response and keep mic locked until speech finishes
            playAgentSpeech(data.currentLine, data.audioBase64);
          } else {
            dispatch(setIsProcessing(false));
          }

          // Check if scenario concluded
          if (data?.finished) {
            const stepResults = data.stepResults || [];
            const totalScore = stepResults.reduce((acc, r) => acc + (r.score || 0), 0);
            const finalScore = stepResults.length > 0 ? Math.round(totalScore / stepResults.length) : 100;

            try {
              await completeSessionAPI(sessionId, finalScore, stepResults);
            } catch (e) {
              console.warn('[Simulator] Complete session call warning:', e.message);
            }
          }

          resolve(data);
        } catch (err) {
          console.error('[Simulator] stopRecordingAndSubmit error:', err.message);
          dispatch(setSimulatorError(err.message));
          dispatch(setIsProcessing(false));
          resolve(null);
        } finally {
          submittingTurnRef.current = false;
        }
      };

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.onstop = handleStop;
        mediaRecorderRef.current.stop();
      } else {
        handleStop();
      }
    });
  }, [dispatch, playAgentSpeech, state.currentSession]);

  const endSession = useCallback(async () => {
    const sessionId = state.currentSession?._id || state.currentSession?.id;
    if (!sessionId) return;
    try {
      dispatch(setIsProcessing(true));
      const data = await completeSessionAPI(sessionId);
      dispatch(resetSimulator());
      return data;
    } catch (err) {
      dispatch(setSimulatorError(err.message));
    } finally {
      dispatch(setIsProcessing(false));
    }
  }, [dispatch, state.currentSession]);

  return {
    ...state,
    startSession,
    startRecording,
    stopRecordingAndSubmit,
    endSession,
  };
};
