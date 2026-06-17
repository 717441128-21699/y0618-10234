import { create } from 'zustand';
import type { User } from '../../shared/types.js';
import { authApi } from '../api/client.js';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  verifyIdentity: (idCard: string, realName: string) => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ phone, password });
      localStorage.setItem('token', response.token);
      set({ user: response.user, token: response.token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (phone: string, password: string, nickname: string) => {
    set({ isLoading: true });
    try {
      await authApi.register({ phone, password, nickname });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    if (!get().token) return;
    set({ isLoading: true });
    try {
      const user = await authApi.getProfile();
      set({ user, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  updateProfile: async (data: any) => {
    set({ isLoading: true });
    try {
      const user = await authApi.updateProfile(data);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  verifyIdentity: async (idCard: string, realName: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.verifyIdentity({ idCard, realName });
      set({ user: response.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setUser: (user: User) => {
    set({ user });
  }
}));
