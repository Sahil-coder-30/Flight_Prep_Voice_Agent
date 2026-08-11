import axios from 'axios';
import { getTokenMemory } from '../../auth/service/auth.api';

const api = axios.create({
  baseURL: '/api/ai',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getTokenMemory();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const submitTurnAPI = async (sessionId, audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'turn.webm');
  const response = await api.post(`/sessions/${sessionId}/turn`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getTranscriptAPI = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/transcript`);
  return response.data;
};
