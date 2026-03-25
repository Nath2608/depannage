import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}

interface Professional {
  id: string;
  tradeType: 'PLUMBING' | 'LOCKSMITH';
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  siretNumber?: string;
  companyName?: string;
}

interface AuthState {
  user: User | null;
  professional: Professional | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isOnboarded: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateProfile: (user: Partial<User>) => void;
  updateProfessional: (professional: Partial<Professional>) => void;
  setAvailability: (isAvailable: boolean) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  tradeType: 'PLUMBING' | 'LOCKSMITH';
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pro_access_token',
  REFRESH_TOKEN: 'pro_refresh_token',
  USER: 'pro_user',
  PROFESSIONAL: 'pro_professional',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  professional: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  isOnboarded: false,

  initialize: async () => {
    try {
      const [accessToken, refreshToken, userStr, professionalStr] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
        SecureStore.getItemAsync(STORAGE_KEYS.PROFESSIONAL),
      ]);

      const user = userStr ? JSON.parse(userStr) : null;
      const professional = professionalStr ? JSON.parse(professionalStr) : null;

      set({
        accessToken,
        refreshToken,
        user,
        professional,
        isAuthenticated: !!accessToken && !!user,
        isOnboarded: professional?.status === 'APPROVED',
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { authApi } = await import('@services/api');
      const response = await authApi.login({ email, password });

      const { user, professional, accessToken, refreshToken } = response;

      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
        professional && SecureStore.setItemAsync(STORAGE_KEYS.PROFESSIONAL, JSON.stringify(professional)),
      ]);

      set({
        user,
        professional,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isOnboarded: professional?.status === 'APPROVED',
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const { authApi } = await import('@services/api');
      const response = await authApi.signupPro(data);

      const { user, professional, accessToken, refreshToken } = response;

      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
        SecureStore.setItemAsync(STORAGE_KEYS.PROFESSIONAL, JSON.stringify(professional)),
      ]);

      set({
        user,
        professional,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isOnboarded: false,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const { authApi } = await import('@services/api');
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
        SecureStore.deleteItemAsync(STORAGE_KEYS.PROFESSIONAL),
      ]);

      set({
        user: null,
        professional: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isOnboarded: false,
      });
    }
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    set({ accessToken, refreshToken });
  },

  updateProfile: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  updateProfessional: (professionalData: Partial<Professional>) => {
    const currentProfessional = get().professional;
    if (currentProfessional) {
      const updatedProfessional = { ...currentProfessional, ...professionalData };
      SecureStore.setItemAsync(STORAGE_KEYS.PROFESSIONAL, JSON.stringify(updatedProfessional));
      set({
        professional: updatedProfessional,
        isOnboarded: updatedProfessional.status === 'APPROVED',
      });
    }
  },

  setAvailability: async (isAvailable: boolean) => {
    try {
      const { professionalApi } = await import('@services/api');
      await professionalApi.setAvailability(isAvailable);
      get().updateProfessional({ isAvailable });
    } catch (error) {
      throw error;
    }
  },
}));
