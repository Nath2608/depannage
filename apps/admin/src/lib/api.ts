import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then((r) => r.data.data),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/admin/dashboard/stats').then((r) => r.data.data),
  getRecentActivity: () => api.get('/admin/dashboard/activity').then((r) => r.data.data),
  getChartData: (period: string) => api.get(`/admin/dashboard/charts?period=${period}`).then((r) => r.data.data),
};

// Users API
export const usersApi = {
  getAll: (params?: { role?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/admin/users/${id}`).then((r) => r.data.data),
  update: (id: string, data: any) => api.put(`/admin/users/${id}`, data).then((r) => r.data.data),
  suspend: (id: string, reason: string) => api.post(`/admin/users/${id}/suspend`, { reason }).then((r) => r.data),
  activate: (id: string) => api.post(`/admin/users/${id}/activate`).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};

// Professionals API
export const professionalsApi = {
  getAll: (params?: { status?: string; tradeType?: string; page?: number; limit?: number }) =>
    api.get('/admin/professionals', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/admin/professionals/${id}`).then((r) => r.data.data),
  getPending: () => api.get('/admin/professionals/pending').then((r) => r.data.data),
  approve: (id: string) => api.post(`/admin/professionals/${id}/approve`).then((r) => r.data),
  reject: (id: string, reason: string) => api.post(`/admin/professionals/${id}/reject`, { reason }).then((r) => r.data),
  suspend: (id: string, reason: string) => api.post(`/admin/professionals/${id}/suspend`, { reason }).then((r) => r.data),
};

// Service Requests API
export const requestsApi = {
  getAll: (params?: { status?: string; tradeType?: string; page?: number; limit?: number }) =>
    api.get('/admin/service-requests', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/admin/service-requests/${id}`).then((r) => r.data.data),
  cancel: (id: string, reason: string) => api.post(`/admin/service-requests/${id}/cancel`, { reason }).then((r) => r.data),
};

// Jobs API
export const jobsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/jobs', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/admin/jobs/${id}`).then((r) => r.data.data),
};

// Disputes API
export const disputesApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/disputes', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/admin/disputes/${id}`).then((r) => r.data.data),
  resolve: (id: string, data: { resolution: string; refundAmount?: number; penaltyToPro?: boolean }) =>
    api.post(`/admin/disputes/${id}/resolve`, data).then((r) => r.data),
  escalate: (id: string) => api.post(`/admin/disputes/${id}/escalate`).then((r) => r.data),
};

// Payments API
export const paymentsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/payments', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/admin/payments/${id}`).then((r) => r.data.data),
  refund: (id: string, amount?: number) => api.post(`/admin/payments/${id}/refund`, { amount }).then((r) => r.data),
};

// Reviews API
export const reviewsApi = {
  getAll: (params?: { page?: number; limit?: number; flagged?: boolean }) =>
    api.get('/admin/reviews', { params }).then((r) => r.data),
  flag: (id: string, reason: string) => api.post(`/admin/reviews/${id}/flag`, { reason }).then((r) => r.data),
  remove: (id: string, reason: string) => api.delete(`/admin/reviews/${id}`, { data: { reason } }).then((r) => r.data),
};

// Reports API
export const reportsApi = {
  getRevenue: (params: { startDate: string; endDate: string; groupBy?: string }) =>
    api.get('/admin/reports/revenue', { params }).then((r) => r.data.data),
  getJobs: (params: { startDate: string; endDate: string }) =>
    api.get('/admin/reports/jobs', { params }).then((r) => r.data.data),
  getProfessionals: (params: { startDate: string; endDate: string }) =>
    api.get('/admin/reports/professionals', { params }).then((r) => r.data.data),
  export: (type: string, params: any) =>
    api.get(`/admin/reports/export/${type}`, { params, responseType: 'blob' }),
};

// Audit Logs API
export const auditApi = {
  getAll: (params?: { action?: string; userId?: string; page?: number; limit?: number }) =>
    api.get('/admin/audit-logs', { params }).then((r) => r.data),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/admin/settings').then((r) => r.data.data),
  update: (data: any) => api.put('/admin/settings', data).then((r) => r.data.data),
  getCommissionRates: () => api.get('/admin/settings/commission').then((r) => r.data.data),
  updateCommissionRates: (data: any) => api.put('/admin/settings/commission', data).then((r) => r.data.data),
};

export default api;
