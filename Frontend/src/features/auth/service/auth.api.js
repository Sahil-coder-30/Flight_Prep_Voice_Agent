import axios from 'axios';

// In-module memory token store (XSS safe — never localStorage)
let _accessToken = null;

export const setTokenMemory = (token) => { _accessToken = token; };
export const getTokenMemory = () => _accessToken;
export const clearTokenMemory = () => { _accessToken = null; };

const api = axios.create({
  baseURL: '/api/auth',
  withCredentials: true, // Required for HttpOnly refresh cookie
});

// Attach bearer token to every request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Silent refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        _accessToken = data.accessToken;
        original.headers.Authorization = `Bearer ${_accessToken}`;
        return api(original);
      } catch {
        _accessToken = null;
        window.location.href = '/?route=login';
      }
    }
    return Promise.reject(error);
  }
);

export const getMeAPI = async () => {
  const response = await api.get('/getMe');
  return response.data;
};

export const refreshTokenAPI = async () => {
  const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
  return response.data;
};

export const logoutAPI = async () => {
  const response = await api.post('/logout');
  return response.data;
};
