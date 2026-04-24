"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

  const { apiFetch, userId: authUserId } = useApi();
  const { setUserId: setAuthUserId } = useAuth();

  const { userId: selectedUserId, setUserId: setSelectedUserId } =
    useCurrentUserStore();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingUsers(true);
      try {
        const res = await apiFetch("/api/users");
        if (!res.ok) return;

        const data = (await res.json()) as UserSummary[];

        if (!cancelled && Array.isArray(data)) {
          setUsers(data);
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  // Keep store initialized from auth if store is empty
  useEffect(() => {
    if (!selectedUserId && authUserId) {
      setSelectedUserId(authUserId);
    }
  }, [selectedUserId, authUserId, setSelectedUserId]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="block">
          <Label className="sr-only">Active user</Label>
          <Select
            value={selectedUserId ? String(selectedUserId) : ""}
            onValueChange={(v) => {
              const n = Number(v);
              const nextUserId = Number.isFinite(n) && n > 0 ? n : null;

              setAuthUserId(nextUserId);
              if (nextUserId) {
                setSelectedUserId(nextUserId);
              }
            }}
          >
            <SelectTrigger className="w-[220px] bg-secondary">
              <SelectValue
                placeholder={loadingUsers ? "Loading users…" : "Choose user"}
              />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block">
          <GlobalSearch />
        </div>
      </div>
    </header>
  );
}
