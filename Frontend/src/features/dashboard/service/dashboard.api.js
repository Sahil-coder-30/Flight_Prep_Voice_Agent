import axios from 'axios';
import { getTokenMemory } from '../../auth/service/auth.api';

const api = axios.create({
  baseURL: '/api/backend',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getTokenMemory();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getScenariosAPI = async () => {
  const response = await api.get('/scenarios');
  return response.data;
};

export const getScenarioByIdAPI = async (id) => {
  const response = await api.get(`/scenarios/${id}`);
  return response.data;
};

export const createSessionAPI = async (scenarioId) => {
  const response = await api.post('/sessions', { scenarioId });
  return response.data;
};

export const getSessionAPI = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

export const completeSessionAPI = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/complete`);
  return response.data;
};

export const getDashboardStatsAPI = async () => {
  // Returns aggregated stats for the current user
  const response = await api.get('/dashboard/stats');
  return response.data;
};
