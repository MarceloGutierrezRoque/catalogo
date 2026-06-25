import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";
import { getUserFromToken } from "@/lib/auth";
import type { TokenResponse } from "@/types/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: number; username: string; email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (username, password) => {
        const { data } = await api.post<TokenResponse>("/api/token/", {
          username,
          password,
        });
        const user = getUserFromToken(data.access);
        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          user: user ?? { id: 0, username, email: "" },
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    { name: "auth-storage" }
  )
);
