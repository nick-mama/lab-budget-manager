"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useCurrentUserStore } from "@/lib/current-user-store";
import { GlobalSearch } from "./global-search";

interface NavbarProps {
  title: string;
  subtitle?: string;
}

type UserSummary = {
  id: number;
  name: string;
  role: string;
};

export function Navbar({ title, subtitle }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const { userId: selectedUserId, setUserId: setSelectedUserId } =
    useCurrentUserStore();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoadingUsers(true);

      try {
        const res = await apiFetch("/api/users");

        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as UserSummary[];

        if (!cancelled && Array.isArray(data)) {
          setUsers(data);
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  useEffect(() => {
    if (user?.id && !selectedUserId) {
      setSelectedUserId(user.id);
    }
  }, [user, selectedUserId, setSelectedUserId]);

  const currentUser =
    users.find((u) => u.id === selectedUserId) ??
    users.find((u) => u.id === user?.id) ??
    null;

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <GlobalSearch />
      </div>
    </header>
  );
}
