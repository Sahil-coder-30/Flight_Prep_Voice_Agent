import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  scenarios: [],
  stats: {
    sessionsCompleted: 0,
    phraseologyScore: 0,
    hoursLogged: 0,
    streak: 0,
  },
  recentSessions: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setScenarios(state, action) {
      state.scenarios = action.payload;
    },
    setStats(state, action) {
      state.stats = { ...state.stats, ...action.payload };
    },
    setRecentSessions(state, action) {
      state.recentSessions = action.payload;
    },
    setDashboardLoading(state, action) {
      state.loading = action.payload;
    },
    setDashboardError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setScenarios, setStats, setRecentSessions, setDashboardLoading, setDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
