import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let refreshRequest: Promise<string> | null = null;

api.interceptors.request.use((config) => {
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

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
