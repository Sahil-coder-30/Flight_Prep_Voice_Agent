import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitTurnAPI, getTranscriptAPI } from '../service/simulator.api';
import { createSessionAPI, completeSessionAPI } from '../../dashboard/service/dashboard.api';
import {
  setCurrentSession, addTranscriptMessage, setIsRecording,
  setIsProcessing, setSimulatorError, setAudioLevel, resetSimulator,
} from '../slice/simulator.slice';

export const useSimulator = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.simulator);

  // Web Audio API refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Start a new ATC session for a given scenario
  const startSession = useCallback(async (scenarioId) => {
    try {
      dispatch(setIsProcessing(true));
      const data = await createSessionAPI(scenarioId);
      dispatch(setCurrentSession(data.session ?? data));
    } catch (err) {
      dispatch(setSimulatorError(err.message));
    } finally {
      dispatch(setIsProcessing(false));
    }
  }, [dispatch]);

  // Begin microphone recording with live audio level monitoring
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup analyser for frequency visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Poll audio level for orb reactivity
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const pollLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        dispatch(setAudioLevel(avg / 255)); // normalize 0-1
        animFrameRef.current = requestAnimationFrame(pollLevel);
      };
      pollLevel();

      // Setup MediaRecorder
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100); // 100ms chunks for real-time level
      dispatch(setIsRecording(true));
    } catch (err) {
      dispatch(setSimulatorError('Microphone access denied: ' + err.message));
    }
  }, [dispatch]);

  // Stop recording and submit audio to AI service
  const stopRecordingAndSubmit = useCallback(async () => {
    if (!mediaRecorderRef.current || !state.currentSession) return;

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        // Cleanup audio monitoring
        cancelAnimationFrame(animFrameRef.current);
        dispatch(setAudioLevel(0));
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        dispatch(setIsRecording(false));
        dispatch(setIsProcessing(true));

        try {
          const data = await submitTurnAPI(state.currentSession._id || state.currentSession.id, audioBlob);
          
          // Add pilot message
          if (data.transcription) {
            dispatch(addTranscriptMessage({
              role: 'pilot',
              text: data.transcription,
              timestamp: new Date().toISOString(),
            }));
          }
          
          // Add ATC AI response
          if (data.response) {
            dispatch(addTranscriptMessage({
              role: 'atc',
              text: data.response,
              timestamp: new Date().toISOString(),
              audioUrl: data.audioUrl,
            }));

            // Play AI audio response if available
            if (data.audioUrl) {
              new Audio(data.audioUrl).play().catch(() => {});
            }
          }

          resolve(data);
        } catch (err) {
          dispatch(setSimulatorError(err.message));
          resolve(null);
        } finally {
          dispatch(setIsProcessing(false));
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [dispatch, state.currentSession]);

  const endSession = useCallback(async () => {
    if (!state.currentSession) return;
    try {
      dispatch(setIsProcessing(true));
      const data = await completeSessionAPI(state.currentSession._id || state.currentSession.id);
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
