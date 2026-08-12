import axios from 'axios';
import { store } from '../store';
import { clearAuth } from '../features/auth/slice/auth.slice';

let _accessToken = null;

export const setAccessToken = (token) => {
  _accessToken = token;
};

export const clearAccessToken = () => {
  _accessToken = null;
};

export const getAccessToken = () => _accessToken;

export const apiClient = axios.create({
  withCredentials: true,
});

// Inject Authorization header from module memory
apiClient.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${_accessToken}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${_accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Transparent token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) return Promise.reject(error);

    const isAuthEndpoint =
      originalRequest.url?.includes('/api/auth/refresh') ||
      originalRequest.url?.includes('/api/auth/logout') ||
      originalRequest.url?.includes('/api/auth/google');

    if (error?.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
          } else {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Post to /refresh — HttpOnly refresh cookie is automatically sent by browser
        const refreshRes = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = refreshRes.data?.accessToken;

        if (!newToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        setAccessToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAccessToken();
        store.dispatch(clearAuth());
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

