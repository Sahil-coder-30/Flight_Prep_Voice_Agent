import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: { totalSessions: 0, completedSessions: 0, averageScore: 0 },
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardStats(state, action) {
      state.stats = action.payload;
    },
    setDashboardLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setDashboardStats, setDashboardLoading } = dashboardSlice.actions;
export default dashboardSlice.reducer;
