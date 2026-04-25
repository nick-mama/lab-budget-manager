"use client";

import { useAuth } from "@/lib/auth";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  username: string;
};

export function useCurrentUser() {
  const { user } = useAuth();

  return {
    user: user as AuthUser | null,
    loading: false,
  };
}