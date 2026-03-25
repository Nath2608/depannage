import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const data = await authApi.login(email, password);

    if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
      throw new Error('Accès non autorisé');
    }

    localStorage.setItem('admin_token', data.accessToken);
    localStorage.setItem('admin_user', JSON.stringify(data.user));

    set({
      user: data.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    }

    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');

    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const userStr = localStorage.getItem('admin_user');

      if (!token || !userStr) {
        set({ isLoading: false });
        return;
      }

      const user = JSON.parse(userStr);

      // Verify token is still valid
      await authApi.me();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
