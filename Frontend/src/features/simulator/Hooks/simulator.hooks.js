import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitTurnAPI } from '../service/simulator.api';
import { createSessionAPI, completeSessionAPI, getScenarioByIdAPI } from '../../dashboard/service/dashboard.api';
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
  const scenarioRef = useRef(null);

  // Start a new ATC session for a given scenario
  const startSession = useCallback(async (scenarioId) => {
    try {
      dispatch(setIsProcessing(true));

      // 1. Fetch full scenario details (including steps template)
      const scRes = await getScenarioByIdAPI(scenarioId);
      const scenario = scRes?.data?.scenario || scRes?.scenario;
      scenarioRef.current = scenario;

      // 2. Create session in Backend
      const sessRes = await createSessionAPI(scenarioId);
      const session = sessRes?.data?.session || sessRes?.session;
      dispatch(setCurrentSession(session));

      // 3. Initiate first turn with AI service to get initial ATC transmission
      if (session && scenario) {
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
        }

        if (turnData?.audioBase64) {
          const audio = new Audio(`data:audio/mpeg;base64,${turnData.audioBase64}`);
          audio.play().catch(() => {});
        }
      }
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
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
      recorder.start(100);
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

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        dispatch(setIsRecording(false));
        dispatch(setIsProcessing(true));

        try {
          const turnRes = await submitTurnAPI(state.currentSession._id || state.currentSession.id, {
            audioBlob,
            scenarioContext: scenarioRef.current,
          });

          const data = turnRes?.data || turnRes;

          // Add ATC AI response
          if (data.currentLine) {
            dispatch(addTranscriptMessage({
              role: 'atc',
              text: data.currentLine,
              timestamp: new Date().toISOString(),
            }));

            // Play AI audio response
            if (data.audioBase64) {
              const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
              audio.play().catch(() => {});
            }
          }

          // Check if scenario concluded
          if (data.finished) {
            const stepResults = data.stepResults || [];
            const totalScore = stepResults.reduce((acc, r) => acc + (r.score || 0), 0);
            const finalScore = stepResults.length > 0 ? Math.round(totalScore / stepResults.length) : 100;

            await completeSessionAPI(state.currentSession._id || state.currentSession.id, finalScore, stepResults);
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
