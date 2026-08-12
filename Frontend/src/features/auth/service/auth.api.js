import { apiClient, setAccessToken, getAccessToken, clearAccessToken } from '../../../services/apiClient';

export const setTokenMemory = (token) => { setAccessToken(token); };
export const getTokenMemory = () => getAccessToken();
export const clearTokenMemory = () => { clearAccessToken(); };

export const getMeAPI = async () => {
  const response = await apiClient.get('/api/auth/getMe');
  return response.data;
};

export const refreshTokenAPI = async () => {
  const response = await apiClient.post('/api/auth/refresh', {});
  return response.data;
};

export const logoutAPI = async () => {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
};

