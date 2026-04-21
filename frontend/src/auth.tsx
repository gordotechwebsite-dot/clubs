import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi, clearAuth, getStoredAdmin, getToken, setStoredAdmin, setToken } from "./api";
import type { Admin } from "./types";

interface AuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => getStoredAdmin());
  const [loading, setLoading] = useState<boolean>(!!getToken() && !getStoredAdmin());

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        if (!cancelled) {
          setAdmin(data);
          setStoredAdmin(data);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          setAdmin(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    setToken(data.access_token);
    setStoredAdmin(data.admin);
    setAdmin(data.admin);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, loading, login, logout }), [admin, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
