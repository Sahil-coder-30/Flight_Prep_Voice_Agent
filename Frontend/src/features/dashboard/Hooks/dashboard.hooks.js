import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getScenariosAPI, getUserStatsAPI, getUserSessionsAPI } from '../service/dashboard.api';
import { setScenarios, setDashboardLoading, setDashboardError, setStats, setRecentSessions } from '../slice/dashboard.slice';

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
      const [scenariosRes, statsRes, sessionsRes] = await Promise.allSettled([
        getScenariosAPI(),
        getUserStatsAPI(),
        getUserSessionsAPI(),
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

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value) {
        const sess = sessionsRes.value?.data || sessionsRes.value;
        dispatch(setRecentSessions(Array.isArray(sess) ? sess.slice(0, 5) : []));
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
