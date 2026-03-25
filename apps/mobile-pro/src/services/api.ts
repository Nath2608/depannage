import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '@store/auth.store';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api/v1';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  signupPro: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    tradeType: 'PLUMBING' | 'LOCKSMITH';
  }) => axiosInstance.post('/auth/signup', { ...data, role: 'PROFESSIONAL' }).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', data).then((r) => r.data.data),

  logout: () => axiosInstance.post('/auth/logout'),

  forgotPassword: (email: string) =>
    axiosInstance.post('/auth/forgot-password', { email }),
};

// Professional API
export const professionalApi = {
  getProfile: () => axiosInstance.get('/professional/profile').then((r) => r.data),

  updateProfile: (data: {
    companyName?: string;
    bio?: string;
    hourlyRate?: number;
  }) => axiosInstance.put('/professional/profile', data).then((r) => r.data),

  setAvailability: (isAvailable: boolean) =>
    axiosInstance.post('/professional/availability', { isAvailable }).then((r) => r.data),

  updateLocation: (latitude: number, longitude: number) =>
    axiosInstance.post('/professional/location', { latitude, longitude }).then((r) => r.data),

  getServiceAreas: () => axiosInstance.get('/professional/service-areas').then((r) => r.data),

  addServiceArea: (data: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    name?: string;
  }) => axiosInstance.post('/professional/service-areas', data).then((r) => r.data),

  removeServiceArea: (id: string) =>
    axiosInstance.delete(`/professional/service-areas/${id}`).then((r) => r.data),

  getStats: () => axiosInstance.get('/professional/stats').then((r) => r.data),

  getEarnings: (period: 'day' | 'week' | 'month' | 'year') =>
    axiosInstance.get(`/professional/earnings?period=${period}`).then((r) => r.data),
};

// Onboarding API
export const onboardingApi = {
  getStatus: () => axiosInstance.get('/professional/onboarding/status').then((r) => r.data),

  submitDocuments: (data: {
    idCardFront: string;
    idCardBack: string;
    proofOfAddress: string;
    insurance: string;
    qualifications: string[];
    siretNumber: string;
    companyName?: string;
  }) => axiosInstance.post('/professional/onboarding/documents', data).then((r) => r.data),

  uploadDocument: (type: string, fileUri: string) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg',
      name: `${type}.jpg`,
    } as any);

    return axiosInstance.post('/professional/onboarding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

// Service Requests API
export const requestsApi = {
  getAvailable: () => axiosInstance.get('/professional/requests/available').then((r) => r.data),

  getById: (id: string) => axiosInstance.get(`/service-requests/${id}`).then((r) => r.data),

  sendQuote: (requestId: string, data: {
    laborCost: number;
    partsCost: number;
    travelCost: number;
    estimatedDuration: number;
    notes?: string;
  }) => axiosInstance.post(`/service-requests/${requestId}/quote`, data).then((r) => r.data),

  decline: (id: string, reason?: string) =>
    axiosInstance.post(`/service-requests/${id}/decline`, { reason }).then((r) => r.data),
};

// Jobs API
export const jobsApi = {
  getMyJobs: (status?: string) =>
    axiosInstance.get('/professional/jobs', { params: { status } }).then((r) => r.data),

  getById: (id: string) => axiosInstance.get(`/jobs/${id}`).then((r) => r.data),

  accept: (id: string) => axiosInstance.post(`/jobs/${id}/accept`).then((r) => r.data),

  decline: (id: string, reason?: string) =>
    axiosInstance.post(`/jobs/${id}/decline`, { reason }).then((r) => r.data),

  startRoute: (id: string) => axiosInstance.post(`/jobs/${id}/start-route`).then((r) => r.data),

  arrive: (id: string) => axiosInstance.post(`/jobs/${id}/arrive`).then((r) => r.data),

  startWork: (id: string) => axiosInstance.post(`/jobs/${id}/start-work`).then((r) => r.data),

  complete: (id: string, data: {
    finalAmount: number;
    workDescription: string;
    photos?: string[];
  }) => axiosInstance.post(`/jobs/${id}/complete`, data).then((r) => r.data),

  updateEta: (id: string, estimatedArrival: string) =>
    axiosInstance.post(`/jobs/${id}/eta`, { estimatedArrival }).then((r) => r.data),

  addNote: (id: string, note: string) =>
    axiosInstance.post(`/jobs/${id}/notes`, { note }).then((r) => r.data),
};

// Notifications API
export const notificationsApi = {
  getAll: () => axiosInstance.get('/notifications').then((r) => r.data),
  markAsRead: (id: string) => axiosInstance.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => axiosInstance.post('/notifications/read-all').then((r) => r.data),
  registerPushToken: (token: string) =>
    axiosInstance.post('/notifications/push-token', { token }).then((r) => r.data),
};

// Reviews API
export const reviewsApi = {
  getMyReviews: () => axiosInstance.get('/professional/reviews').then((r) => r.data),
  respondToReview: (reviewId: string, response: string) =>
    axiosInstance.post(`/reviews/${reviewId}/respond`, { response }).then((r) => r.data),
};

// Unified API object
const api = {
  auth: authApi,
  professional: professionalApi,
  onboarding: onboardingApi,
  requests: requestsApi,
  jobs: jobsApi,
  notifications: notificationsApi,
  reviews: reviewsApi,
};

export { api };
export default api;
