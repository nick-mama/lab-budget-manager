"use client";

import * as React from "react";
import { buildApiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ApiFetchInit = RequestInit & {
  headers?: Record<string, string>;
};

export function useApi() {
  const { token } = useAuth();

  const apiFetch = React.useCallback(
    async (path: string, init: ApiFetchInit = {}) => {
      const headers: Record<string, string> = {
        ...(init.headers ?? {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(buildApiUrl(path), {
        ...init,
        headers,
      });

      return res;
    },
    [token],
  );

  return { apiFetch };
}