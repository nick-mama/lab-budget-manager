"use client";

import { useEffect, useState } from "react";
import { useCurrentUserStore } from "@/lib/current-user-store";

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function useCurrentUser() {
  const { userId } = useCurrentUserStore();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!userId) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch("http://localhost:4000/api/users", {
          headers: {
            "x-user-id": "5",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load users");
        }

        const users = (await res.json()) as UserRecord[];
        const currentUser = users.find((u) => u.id === userId) ?? null;

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, loading };
}
