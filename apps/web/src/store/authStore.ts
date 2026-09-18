import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isImpersonating?: boolean;
  originalUserId?: string;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  startImpersonation: (token: string, user: User, originalUserId: string) => void;
  stopImpersonation: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isImpersonating: false,
      originalUserId: undefined,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      startImpersonation: (token, user, originalUserId) => set({ token, user, isImpersonating: true, originalUserId }),
      stopImpersonation: (token, user) => set({ token, user, isImpersonating: false, originalUserId: undefined }),
      logout: () => set({ token: null, user: null, isImpersonating: false, originalUserId: undefined }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
