import api from './client';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  signup: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/signup', data),
  register: (data: { email: string; password: string; name: string; role: string }) =>
    api.post('/auth/register', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};

// Campaigns
export const campaignsApi = {
  getAll: (page = 1, limit = 10) => api.get(`/campaigns?page=${page}&limit=${limit}`),
  getOne: (id: number) => api.get(`/campaigns/${id}`),
  create: (data: {
    name: string; subject: string; htmlContent: string; recipients: string[]; scheduledAt?: string; sendMode?: string;
  }) => api.post('/campaigns', data),
  sendNow: (id: number) => api.post(`/campaigns/${id}/send`),
  retry: (id: number) => api.post(`/campaigns/${id}/retry`),
  remove: (id: number) => api.delete(`/campaigns/${id}`),
};

// Contacts
export const contactsApi = {
  getAll: (page = 1, search?: string) =>
    api.get(`/contacts?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  add: (email: string, name?: string) => api.post('/contacts', { email, name }),
  update: (id: number, data: object) => api.put(`/contacts/${id}`, data),
  remove: (id: number) => api.delete(`/contacts/${id}`),
  import: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/contacts/import', form);
  },
  deduplicate: () => api.post('/contacts/deduplicate'),
};


