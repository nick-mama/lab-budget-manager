"use client";

import * as React from "react";

type AuthContextValue = {
  userId: number | null;
  setUserId: (id: number | null) => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "lab-budget-manager:userId";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = React.useState<number | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const n = Number(raw);
      if (Number.isInteger(n) && n > 0) setUserIdState(n);
    } catch {
      // ignore
    }
  }, []);

  const setUserId = React.useCallback((id: number | null) => {
    setUserIdState(id);
    try {
      if (!id) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      // ignore
    }
  }, []);

  const value = React.useMemo(() => ({ userId, setUserId }), [userId, setUserId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

