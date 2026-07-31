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
  }, attachments: File[] = []) => {
    const form = new FormData();
    form.append('name', data.name);
    form.append('subject', data.subject);
    form.append('htmlContent', data.htmlContent);
    data.recipients.forEach((r) => form.append('recipients', r));
    if (data.scheduledAt) form.append('scheduledAt', data.scheduledAt);
    if (data.sendMode) form.append('sendMode', data.sendMode);
    attachments.forEach((f) => form.append('attachments', f));
    return api.post('/campaigns', form);
  },
  sendNow: (id: number) => api.post(`/campaigns/${id}/send`),
  retry: (id: number) => api.post(`/campaigns/${id}/retry`),
  remove: (id: number) => api.delete(`/campaigns/${id}`),
  bulkRemove: (ids: number[]) => api.delete('/campaigns', { data: { ids } }),
};

// Contacts
export const contactsApi = {
  getAll: (page = 1, limit = 50, search?: string) =>
    api.get(`/contacts?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  add: (email: string, name?: string) => api.post('/contacts', { email, name }),
  update: (id: number, data: object) => api.put(`/contacts/${id}`, data),
  remove: (id: number) => api.delete(`/contacts/${id}`),
  bulkRemove: (ids: number[]) => api.delete('/contacts', { data: { ids } }),
  import: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/contacts/import', form);
  },
  deduplicate: () => api.post('/contacts/deduplicate'),
};


