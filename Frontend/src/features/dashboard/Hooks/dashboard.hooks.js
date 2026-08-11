import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getScenariosAPI } from '../service/dashboard.api';
import { setScenarios, setDashboardLoading, setDashboardError, setStats } from '../slice/dashboard.slice';

// Placeholder stats — replace with real API when /api/backend/dashboard/stats is available
const MOCK_STATS = {
  sessionsCompleted: 24,
  phraseologyScore: 87,
  hoursLogged: 18.5,
  streak: 5,
};

const MOCK_RECENT = [
  { id: 1, scenario: 'KJFK Departure', score: 91, duration: '14m', date: '2026-08-10' },
  { id: 2, scenario: 'KLAX Approach', score: 78, duration: '22m', date: '2026-08-09' },
  { id: 3, scenario: 'EGLL Ground', score: 85, duration: '11m', date: '2026-08-07' },
];

export const useDashboard = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.dashboard);

  const loadDashboard = useCallback(async () => {
    try {
      dispatch(setDashboardLoading(true));
      const data = await getScenariosAPI();
      dispatch(setScenarios(data.scenarios ?? data ?? []));
      // Load stats (use mock until backend endpoint ready)
      dispatch(setStats(MOCK_STATS));
    } catch (err) {
      dispatch(setDashboardError(err.message));
    } finally {
      dispatch(setDashboardLoading(false));
    }
  }, [dispatch]);

  return {
    ...state,
    recentSessions: MOCK_RECENT,
    loadDashboard,
  };
};
