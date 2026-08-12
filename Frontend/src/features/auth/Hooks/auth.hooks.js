import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMeAPI, refreshTokenAPI, logoutAPI, setTokenMemory, clearTokenMemory } from '../service/auth.api';
import { setUser, setAccessToken, setAuthLoading, setAuthError, clearAuth } from '../slice/auth.slice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.auth);

  // Silently refresh token and fetch current user on mount
  const initAuth = useCallback(async () => {
    try {
      dispatch(setAuthLoading(true));
      const refreshRes = await refreshTokenAPI();
      const accessToken = refreshRes?.accessToken || refreshRes?.data?.accessToken;
      if (accessToken) {
        setTokenMemory(accessToken);
        dispatch(setAccessToken(accessToken));
        const meRes = await getMeAPI();
        const user = meRes?.data?.user || meRes?.user || meRes;
        dispatch(setUser(user));
      } else {
        dispatch(clearAuth());
      }
    } catch {
      // Not authenticated — stay on login
      dispatch(clearAuth());
    } finally {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await logoutAPI();
    } finally {
      clearTokenMemory();
      dispatch(clearAuth());
    }
  }, [dispatch]);

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  return {
    ...state,
    initAuth,
    logout,
    loginWithGoogle,
  };
};
