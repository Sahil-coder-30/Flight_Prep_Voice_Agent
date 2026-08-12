import { apiClient } from '../../../services/apiClient';

/**
 * Converts Blob to Base64 string.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Submits a turn to the AI Service.
 * Can pass audioBlob OR pilotTranscript text directly.
 */
export const submitTurnAPI = async (sessionId, { audioBlob, pilotTranscript, scenarioContext }) => {
  let audioBase64 = null;
  if (audioBlob) {
    audioBase64 = await blobToBase64(audioBlob);
  }

  const payload = {
    audioBase64,
    pilotTranscript,
    steps: scenarioContext?.steps,
    aircraftCallsign: scenarioContext?.aircraftCallsign,
    airport: scenarioContext?.airport,
  };

  const response = await apiClient.post(`/api/ai/sessions/${sessionId}/turn`, payload);
  return response.data;
};

export const getTranscriptAPI = async (sessionId) => {
  const response = await apiClient.get(`/api/ai/sessions/${sessionId}/transcript`);
  return response.data;
};

export const getTokenUsageAPI = async (sessionId) => {
  const response = await apiClient.get(`/api/ai/sessions/${sessionId}/tokens`);
  return response.data;
};

export const getUserPilotResponsesAPI = async (userId) => {
  const response = await apiClient.get(`/api/ai/users/${userId}/responses`);
  return response.data;
};

export const getUserTemplateScoresAPI = async (userId) => {
  const response = await apiClient.get(`/api/ai/users/${userId}/template-scores`);
  return response.data;
};

