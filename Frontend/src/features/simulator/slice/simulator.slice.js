import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSession: null,
  transcript: [],
  isRecording: false,
  isProcessing: false,
  error: null,
  // 3D Orb state
  orbMode: 'IDLE_CORE',
  talkingState: { isTalking: false, intensity: 0 },
  colorScheme: 'emerald',
  particleCount: 1200,
  audioLevel: 0,
  // Swarm settings
  swarmSettings: {
    particleCount: 1200,
    particleSize: 0.055,
    metalness: 0.92,
    roughness: 0.12,
    morphSpeed: 1.0,
    repulsionForce: 1.5,
    gravityStrength: 1.0,
    autoRotate: true,
    colorScheme: 'emerald',
  },
};

const simulatorSlice = createSlice({
  name: 'simulator',
  initialState,
  reducers: {
    setCurrentSession(state, action) {
      state.currentSession = action.payload;
    },
    setTranscript(state, action) {
      state.transcript = action.payload;
    },
    addTranscriptMessage(state, action) {
      state.transcript.push(action.payload);
    },
    setIsRecording(state, action) {
      state.isRecording = action.payload;
    },
    setIsProcessing(state, action) {
      state.isProcessing = action.payload;
    },
    setSimulatorError(state, action) {
      state.error = action.payload;
    },
    setOrbMode(state, action) {
      state.orbMode = action.payload;
    },
    setTalkingState(state, action) {
      state.talkingState = action.payload;
    },
    setAudioLevel(state, action) {
      state.audioLevel = action.payload;
      // Sync talking state from audio level
      state.talkingState = {
        isTalking: action.payload > 0.05,
        intensity: action.payload,
      };
    },
    setSwarmSettings(state, action) {
      state.swarmSettings = { ...state.swarmSettings, ...action.payload };
    },
    resetSimulator(state) {
      state.currentSession = null;
      state.transcript = [];
      state.isRecording = false;
      state.isProcessing = false;
      state.error = null;
      state.talkingState = { isTalking: false, intensity: 0 };
      state.audioLevel = 0;
    },
  },
});

export const {
  setCurrentSession, setTranscript, addTranscriptMessage,
  setIsRecording, setIsProcessing, setSimulatorError,
  setOrbMode, setTalkingState, setAudioLevel, setSwarmSettings, resetSimulator,
} = simulatorSlice.actions;
export default simulatorSlice.reducer;
