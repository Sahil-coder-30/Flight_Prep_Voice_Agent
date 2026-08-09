import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSession: null,
  transcript: [],
  isRecording: false,
  isProcessing: false,
  error: null,
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
  },
});

export const {
  setCurrentSession,
  setTranscript,
  addTranscriptMessage,
  setIsRecording,
  setIsProcessing,
  setSimulatorError,
} = simulatorSlice.actions;
export default simulatorSlice.reducer;
