import { apiClient } from '../../../services/apiClient';

export const getScenariosAPI = async () => {
  const response = await apiClient.get('/api/backend/scenarios');
  return response.data;
};

export const getScenarioByIdAPI = async (id) => {
  const response = await apiClient.get(`/api/backend/scenarios/${id}`);
  return response.data;
};

export const createSessionAPI = async (scenarioId) => {
  const response = await apiClient.post('/api/backend/sessions', { scenarioId });
  return response.data;
};

export const getSessionAPI = async (sessionId) => {
  const response = await apiClient.get(`/api/backend/sessions/${sessionId}`);
  return response.data;
};

export const completeSessionAPI = async (sessionId, score = 100, stepResults = []) => {
  const response = await apiClient.post(`/api/backend/sessions/${sessionId}/complete`, { score, stepResults });
  return response.data;
};

export const getUserStatsAPI = async () => {
  const response = await apiClient.get('/api/backend/users/stats');
  return response.data;
};

export const getUserProgressAPI = async () => {
  const response = await apiClient.get('/api/backend/users/progress');
  return response.data;
};

export const getUserWeakAreasAPI = async () => {
  const response = await apiClient.get('/api/backend/users/weak-areas');
  return response.data;
};

export const getUserSessionsAPI = async () => {
  const response = await apiClient.get('/api/backend/sessions/my-sessions');
  return response.data;
};

export const getSessionTranscriptAPI = async (sessionId) => {
  const response = await apiClient.get(`/api/ai/sessions/${sessionId}/transcript`);
  return response.data;
};

