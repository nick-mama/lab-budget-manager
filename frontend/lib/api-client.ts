"use client";

import * as React from "react";
import { buildApiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ApiFetchInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export function useApi() {
  const { userId } = useAuth();

  const apiFetch = React.useCallback(
    async (path: string, init: ApiFetchInit = {}) => {
      const headers: Record<string, string> = {
        ...(init.headers ?? {}),
      };
      if (userId) headers["x-user-id"] = String(userId);

      const res = await fetch(buildApiUrl(path), {
        ...init,
        headers,
      });

      return res;
    },
    [userId],
  );

  return { apiFetch, userId };
}

