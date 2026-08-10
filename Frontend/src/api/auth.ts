import { mockStore } from './mockStore';
import { AUTH_GOOGLE_ENDPOINT, toAbsoluteApiUrl } from './endpoints';

const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false';

export const getGoogleAuthUrl = () => toAbsoluteApiUrl(AUTH_GOOGLE_ENDPOINT);

export const shouldUseMockApi = () => useMockApi;

export const signInWithGoogle = async () => {
  if (useMockApi) {
    return {
      redirectUrl: '/scenarios',
      mockUser: {
        id: 'demo-pilot',
        email: 'demo.pilot@atc.local',
        name: 'Demo Pilot',
      },
    };
  }

  return {
    redirectUrl: getGoogleAuthUrl(),
    mockUser: null,
  };
};

export const warmMockAuth = async () => {
  if (!useMockApi) {
    return null;
  }

  await Promise.resolve(mockStore.fetchScenarios());
  return {
    id: 'demo-pilot',
    email: 'demo.pilot@atc.local',
    name: 'Demo Pilot',
  };
};
