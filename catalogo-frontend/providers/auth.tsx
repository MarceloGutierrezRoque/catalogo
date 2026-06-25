"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: number; username: string; email: string } | null;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // Mark as loaded after mount — the store is already hydrated via persist
    setLoading(false);
  }, [setLoading]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
