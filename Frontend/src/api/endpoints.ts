export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '';

const joinBase = (path: string) => `${API_BASE_URL}${path}`;

export const AUTH_GOOGLE_ENDPOINT = '/api/auth/google';
export const AUTH_REFRESH_ENDPOINT = '/api/auth/refresh';

export const SCENARIOS_ENDPOINT = '/api/backend/scenarios';
export const scenarioByIdEndpoint = (scenarioId: string) => `/api/backend/scenarios/${scenarioId}`;

export const SESSIONS_ENDPOINT = '/api/backend/sessions';
export const sessionByIdEndpoint = (sessionId: string) => `/api/backend/sessions/${sessionId}`;
export const completeSessionEndpoint = (sessionId: string) => `/api/backend/sessions/${sessionId}/complete`;

export const AI_TURN_ENDPOINT = (sessionId: string) => `/api/ai/sessions/${sessionId}/turn`;
export const AI_TRANSCRIPT_ENDPOINT = (sessionId: string) => `/api/ai/sessions/${sessionId}/transcript`;

export const toAbsoluteApiUrl = (path: string) => joinBase(path);
