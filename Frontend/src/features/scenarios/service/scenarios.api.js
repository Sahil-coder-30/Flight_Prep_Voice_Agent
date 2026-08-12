import { apiClient } from '../../../services/apiClient';

export const fetchScenariosAPI = async () => {
  const response = await apiClient.get('/api/backend/scenarios');
  return response.data;
};

export const fetchScenarioByIdAPI = async (id) => {
  const response = await apiClient.get(`/api/backend/scenarios/${id}`);
  return response.data;
};
