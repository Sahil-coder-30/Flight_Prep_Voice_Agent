import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitTurnAPI } from '../service/simulator.api';
import { createSessionAPI, completeSessionAPI, getScenarioByIdAPI } from '../../dashboard/service/dashboard.api';
import {
  setCurrentSession, addTranscriptMessage, setIsRecording,
  setIsProcessing, setSimulatorError, setAudioLevel, resetSimulator,
} from '../slice/simulator.slice';

export function speakLine(text, audioBase64, onEnded) {
  const finish = () => {
    if (onEnded) onEnded();
  };

  if (!text && !audioBase64) {
    finish();
    return;
  }

  if (audioBase64) {
    const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
    audio.onended = finish;
    audio.onerror = () => fallbackWebSpeech(text, finish);

    audio.play().catch((e) => {
      console.warn('[Simulator] HTML5 Audio playback blocked or failed, using SpeechSynthesis fallback:', e.message);
      fallbackWebSpeech(text, finish);
    });
  } else {
    fallbackWebSpeech(text, finish);
  }
}

function fallbackWebSpeech(text, onEnded) {
  if ('speechSynthesis' in window && text) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => { if (onEnded) onEnded(); };
      utterance.onerror = () => { if (onEnded) onEnded(); };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (onEnded) onEnded();
    }
  } else {
    if (onEnded) onEnded();
  }
}

export const useSimulator = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.simulator);

  // Web Audio API refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const scenarioRef = useRef(null);

  // Start a new ATC session for a given scenario
  const startSession = useCallback(async (scenarioId) => {
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
            dispatch(setIsProcessing(true));
            speakLine(turnData.currentLine, turnData.audioBase64, () => {
              dispatch(setIsProcessing(false));
            });
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
    }
  }, [dispatch]);

  // Begin microphone recording with live audio level monitoring
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
        dispatch(setAudioLevel(avg / 255)); // normalize 0-1
        animFrameRef.current = requestAnimationFrame(pollLevel);
      };
      pollLevel();

      // Setup MediaRecorder
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      dispatch(setIsRecording(true));
    } catch (err) {
      dispatch(setSimulatorError('Microphone access denied: ' + err.message));
    }
  }, [dispatch]);

  // Stop recording and submit audio to AI service safely
  const stopRecordingAndSubmit = useCallback(async () => {
    if (!mediaRecorderRef.current) {
      dispatch(setIsRecording(false));
      return null;
    }

    const sessionId = state.currentSession?._id || state.currentSession?.id || 'sim_session_' + Date.now();

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
        
        dispatch(setIsRecording(false));

        if (audioBlob.size < 100) {
          console.warn('[Simulator] Audio recording was empty or too brief');
          resolve(null);
          return;
        }

        dispatch(setIsProcessing(true));

        try {
          const turnRes = await submitTurnAPI(sessionId, {
            audioBlob,
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
          }

          // Add ATC AI response
          if (data?.currentLine) {
            dispatch(addTranscriptMessage({
              role: 'atc',
              text: data.currentLine,
              timestamp: new Date().toISOString(),
            }));

            // Play AI audio response and keep mic locked until speech finishes
            speakLine(data.currentLine, data.audioBase64, () => {
              dispatch(setIsProcessing(false));
            });
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
        }
      };

      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.onstop = handleStop;
        mediaRecorderRef.current.stop();
      } else {
        handleStop();
      }
    });
  }, [dispatch, state.currentSession]);

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
