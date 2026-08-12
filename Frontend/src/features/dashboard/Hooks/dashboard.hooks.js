import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getScenariosAPI, getUserStatsAPI } from '../service/dashboard.api';
import { setScenarios, setDashboardLoading, setDashboardError, setStats } from '../slice/dashboard.slice';

const DEFAULT_STATS = {
  sessionsCompleted: 0,
  phraseologyScore: 100,
  hoursLogged: 0,
  streak: 0,
  weakAreas: [],
};

export const useDashboard = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.dashboard);

  const loadDashboard = useCallback(async () => {
    try {
      dispatch(setDashboardLoading(true));
      const [scenariosRes, statsRes] = await Promise.allSettled([
        getScenariosAPI(),
        getUserStatsAPI(),
      ]);

      if (scenariosRes.status === 'fulfilled') {
        const scData = scenariosRes.value;
        dispatch(setScenarios(scData?.data?.scenarios ?? scData?.scenarios ?? scData ?? []));
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        const st = statsRes.value.data;
        dispatch(setStats({
          sessionsCompleted: st.totalSessions || 0,
          phraseologyScore: st.avgScore || 100,
          hoursLogged: Number(( (st.totalTimeSeconds || 0) / 3600 ).toFixed(1)),
          streak: st.currentStreak || 0,
          weakAreas: st.weakAreas || [],
        }));
      } else {
        dispatch(setStats(DEFAULT_STATS));
      }
    } catch (err) {
      dispatch(setDashboardError(err.message));
    } finally {
      dispatch(setDashboardLoading(false));
    }
  }, [dispatch]);

  return {
    ...state,
    recentSessions: [],
    loadDashboard,
  };
};
