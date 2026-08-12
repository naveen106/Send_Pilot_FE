import axios from 'axios';
import { isOfflineDemoSession, OFFLINE_DEMO_SESSION_KEY } from './offlineDemo';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let refreshRequest: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  // Demo mode is UI-only: do not send any request to the backend, even without a JWT.
  if (isOfflineDemoSession()) {
    throw new Error('Backend API access is disabled in offline demo mode');
  }

  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as (typeof err.config & { _retry?: boolean }) | undefined;
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

    if (err.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      if (localStorage.getItem('token')) {
        originalRequest._retry = true;
        refreshRequest ??= api.post('/auth/refresh')
          .then((response) => {
            const data = response.data.data;
            localStorage.setItem('token', data.token);
            return data.token as string;
          })
          .finally(() => { refreshRequest = null; });

        try {
          const token = await refreshRequest;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          // Fall through to the normal session cleanup below.
        }
      }
    }

    if (err.response?.status === 401 && sessionStorage.getItem(OFFLINE_DEMO_SESSION_KEY) !== 'true') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
