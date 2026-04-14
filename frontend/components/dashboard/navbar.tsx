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

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export function Navbar({ title, subtitle }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { apiFetch, userId } = useApi();
  const { setUserId } = useAuth();
  const [users, setUsers] = useState<Array<{ id: number; name: string; role: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const res = await apiFetch("/api/users");
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ id: number; name: string; role: string }>;
        if (!cancelled && Array.isArray(data)) setUsers(data);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Active user (demo auth) */}
        <div className="block">
          <Label className="sr-only">Active user</Label>
          <Select
            value={userId ? String(userId) : ""}
            onValueChange={(v) => {
              const n = Number(v);
              setUserId(Number.isFinite(n) && n > 0 ? n : null);
            }}
          >
            <SelectTrigger className="w-[220px] bg-secondary">
              <SelectValue placeholder={loadingUsers ? "Loading users…" : "Choose user"} />
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

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects, budgets..."
            className="w-64 bg-secondary pl-9"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-72 rounded-lg border border-border bg-card p-4 shadow-md">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Notifications
              </h3>
              {/* Sample notifications - replace with dynamic data as needed */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>New budget request submitted.</p>
                <p>1 line item is awaiting review.</p>
                <p>Quarterly budget summary is ready.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
