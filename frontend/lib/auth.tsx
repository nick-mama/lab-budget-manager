"use client";

import * as React from "react";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  username: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (nextToken: string | null, nextUser: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "lab-budget-manager:token";
const USER_KEY = "lab-budget-manager:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    try {
      const savedToken = window.localStorage.getItem(TOKEN_KEY);
      const savedUser = window.localStorage.getItem(USER_KEY);

      if (savedToken) {
        setToken(savedToken);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
    }
  }, []);

  const setAuth = React.useCallback(
    (nextToken: string | null, nextUser: AuthUser | null) => {
      setToken(nextToken);
      setUser(nextUser);

      try {
        if (nextToken) {
          window.localStorage.setItem(TOKEN_KEY, nextToken);
        } else {
          window.localStorage.removeItem(TOKEN_KEY);
        }

        if (nextUser) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        } else {
          window.localStorage.removeItem(USER_KEY);
        }
      } catch {
      }
    },
    [],
  );

  const logout = React.useCallback(() => {
    setAuth(null, null);
  }, [setAuth]);

  const value = React.useMemo(
    () => ({
      token,
      user,
      setAuth,
      logout,
    }),
    [token, user, setAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}