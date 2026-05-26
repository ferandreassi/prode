import { create } from 'zustand';
import { api } from '@/services/api';
import { queryClient } from '@/queryClient';
import { useUIStore } from '@/store/uiStore';

export interface User {
  id: string;
  nickname: string;
  avatarUrl: string;
  createdAt?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (nickname: string, password: string) => Promise<void>;
  register: (nickname: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (updates: { nickname: string; avatarUrl?: string }) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('prode_u_jwt'),
  isAuthenticated: false,
  isLoading: true,
  
  login: async (nickname, password) => {
    try {
      const res = await api.post('/auth/login', { nickname, password });
      const { token, user } = res;
      localStorage.setItem('prode_u_jwt', token);
      set({
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl || user.avatar_url,
        },
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  register: async (nickname, password) => {
    try {
      const res = await api.post('/auth/register', { nickname, password });
      const { token, user } = res;
      localStorage.setItem('prode_u_jwt', token);
      set({
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl || user.avatar_url,
        },
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('prode_u_jwt');
    queryClient.clear();
    useUIStore.getState().setActiveTab('dashboard');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('prode_u_jwt');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null });
      return;
    }

    if (!get().isAuthenticated) {
      set({ isLoading: true });
    }
    try {
      const res = await api.get('/users/me');
      const backendUser = res.user;
      set({
        token,
        user: {
          id: backendUser.id,
          nickname: backendUser.nickname,
          avatarUrl: backendUser.avatar_url || backendUser.avatarUrl,
          createdAt: backendUser.created_at || backendUser.createdAt,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking auth, logging out:', error);
      localStorage.removeItem('prode_u_jwt');
      queryClient.clear();
      useUIStore.getState().setActiveTab('dashboard');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          nickname: updates.nickname,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : currentUser.avatarUrl,
        },
      });
    }
  },
}));
