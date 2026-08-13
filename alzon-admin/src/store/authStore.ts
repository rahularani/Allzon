import { create } from 'zustand';
import { api } from '../api/client';

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  role: 'BUYER' | 'SUPPLIER' | 'ADMIN' | 'VERIFICATION_STAFF';
  isVerified: boolean;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isInitializing: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),

  initAuth: async () => {
    try {
      const res = await api.post('/auth/refresh');
      const token = res.data.data.accessToken;
      set({ accessToken: token });

      const meRes = await api.get('/auth/me');
      set({ user: meRes.data.data });
    } catch {
      set({ accessToken: null, user: null });
    } finally {
      set({ isInitializing: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      set({ accessToken: null, user: null });
    }
  },
}));
