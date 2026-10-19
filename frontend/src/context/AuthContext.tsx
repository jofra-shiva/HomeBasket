"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: object) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (identifier: string, password: string) => {
    const res = await authApi.login({ identifier, password });
    if (res.data?.token && typeof window !== "undefined") {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
  };

  const register = async (data: object) => {
    const res = await authApi.register(data);
    if (res.data?.token && typeof window !== "undefined") {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
