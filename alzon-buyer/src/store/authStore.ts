import { create } from 'zustand';
import { api } from '../api/client';

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  role: 'BUYER' | 'SUPPLIER' | 'ADMIN' | 'VERIFICATION_STAFF';
  isVerified: boolean;
  buyerProfile?: {
    id: string;
    fullName: string;
    businessName: string | null;
  } | null;
  supplierProfile?: {
    id: string;
    businessName: string;
    slug: string;
    verificationStatus: string;
  } | null;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isInitializing: true,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),

  initAuth: async () => {
    try {
      // Attempt silent refresh on initial page load using httpOnly refresh cookie
      const res = await api.post('/auth/refresh');
      const token = res.data.data.accessToken;
      set({ accessToken: token });

      // Fetch user profile
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
      // Ignore logout errors
    } finally {
      set({ accessToken: null, user: null });
    }
  },
}));
