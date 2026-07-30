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

// Users
export const usersApi = {
  getAll: () => api.get('/users'),
  updateRole: (id: number, role: string) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id: number) => api.patch(`/users/${id}/toggle`),
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
    name: string; subject: string; to: string;
    htmlContent: string; scheduledAt?: string; sendMode?: string; attachments?: File[];
  }) => {
    const form = new FormData();
    form.append('name', data.name);
    form.append('subject', data.subject);
    form.append('to', data.to);
    form.append('htmlContent', data.htmlContent);
    if (data.scheduledAt) form.append('scheduledAt', data.scheduledAt);
    if (data.sendMode) form.append('sendMode', data.sendMode);
    data.attachments?.forEach((f) => form.append('attachments', f));
    return api.post('/campaigns', form);
  },
  sendNow: (id: number) => api.post(`/campaigns/${id}/send`),
  retry: (id: number) => api.post(`/campaigns/${id}/retry`),
};

// Contacts
export const contactsApi = {
  getAll: (page = 1, search?: string) =>
    api.get(`/contacts?page=${page}${search ? `&search=${search}` : ''}`),
  add: (email: string, name?: string) => api.post('/contacts', { email, name }),
  update: (id: number, data: object) => api.put(`/contacts/${id}`, data),
  remove: (id: number) => api.delete(`/contacts/${id}`),
  importCSV: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/contacts/import', form);
  },
  importExcel: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/contacts/import', form);
  },
  deduplicate: () => api.post('/contacts/deduplicate'),
};

// SMTP
export const smtpApi = {
  getConfig: () => api.get('/smtp/config'),
  test: (config?: object) => api.post('/smtp/test', config || {}),
};

// Logs
export const logsApi = {
  getLogs: (page = 1, level?: string) =>
    api.get(`/logs?page=${page}${level ? `&level=${level}` : ''}`),
  getScheduler: () => api.get('/scheduler'),
  toggleScheduler: (enable: boolean) => api.post('/scheduler/toggle', { enable }),
};
