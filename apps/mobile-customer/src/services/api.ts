import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '@store/auth.store';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api/v1';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  },
);

// API Response type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Helper to extract data from response
export const extractData = <T>(response: { data: ApiResponse<T> }): T => {
  if (!response.data.success && response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};

// Auth API
export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/auth/signup', { ...data, role: 'CUSTOMER' }).then(extractData),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(extractData),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then(extractData),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(extractData),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }).then(extractData),
};

// Customer API
export const customerApi = {
  getProfile: () => api.get('/customer/profile').then(extractData),

  updateProfile: (data: { firstName?: string; lastName?: string }) =>
    api.put('/customer/profile', data).then(extractData),

  getAddresses: () => api.get('/customer/addresses').then(extractData),

  createAddress: (data: {
    label: string;
    streetLine1: string;
    postalCode: string;
    city: string;
    latitude: number;
    longitude: number;
    accessNotes?: string;
    isDefault?: boolean;
  }) => api.post('/customer/addresses', data).then(extractData),

  getRequests: (page = 1, limit = 20) =>
    api.get(`/customer/requests?page=${page}&limit=${limit}`).then(extractData),

  getInvoices: (page = 1, limit = 20) =>
    api.get(`/customer/invoices?page=${page}&limit=${limit}`).then(extractData),
};

// Service Requests API
export const requestsApi = {
  create: (data: {
    tradeType: string;
    urgencyLevel: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    addressId?: string;
  }) => api.post('/service-requests', data),

  getById: (id: string) => api.get(`/service-requests/${id}`),

  getMyRequests: () => api.get('/service-requests/my'),

  cancel: (id: string) => api.post(`/service-requests/${id}/cancel`),

  estimate: (data: {
    tradeType: string;
    urgencyLevel: string;
    latitude: number;
    longitude: number;
  }) => api.post('/service-requests/estimate', data),
};

// Quotes API
export const quotesApi = {
  accept: (quoteId: string) => api.post(`/quotes/${quoteId}/accept`),
  decline: (quoteId: string) => api.post(`/quotes/${quoteId}/decline`),
};

// Jobs API
export const jobsApi = {
  getById: (id: string) => api.get(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my'),
};

// Notifications API
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  registerPushToken: (token: string) => api.post('/notifications/push-token', { token }),
};

// Payments API
export const paymentsApi = {
  createPaymentIntent: (jobId: string) =>
    api.post(`/payments/create-intent`, { jobId }),
  getPaymentMethods: () => api.get('/payments/methods'),
  addPaymentMethod: (paymentMethodId: string) =>
    api.post('/payments/methods', { paymentMethodId }),
};

// Disputes API
export const disputesApi = {
  open: (data: { jobId: string; reason: string; description: string }) =>
    api.post('/disputes', data),
  getById: (id: string) => api.get(`/disputes/${id}`),
};

// Reviews API
export const reviewsApi = {
  create: (data: { jobId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  getByJobId: (jobId: string) => api.get(`/reviews/job/${jobId}`),
};

// Unified API object for convenience - named 'api' for import simplicity
const apiMethods = {
  auth: authApi,
  customer: customerApi,
  requests: requestsApi,
  quotes: quotesApi,
  jobs: jobsApi,
  notifications: notificationsApi,
  payments: paymentsApi,
  disputes: disputesApi,
  reviews: reviewsApi,
};

export { apiMethods as api };
export default apiMethods;
