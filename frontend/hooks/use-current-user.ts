"use client";

import { useAuth } from "@/lib/auth";

export function useCurrentUser() {
  const { user } = useAuth();

  return {
    user,
    loading: false,
  };
}