"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MoreHorizontal, FolderKanban } from "lucide-react";
import { useApi } from "@/lib/api-client";

type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  projects: string[];
};

function getRoleBadgeStyles(role: string): string {
  switch (role) {
    case "Lab Manager":
      return "bg-primary/10 text-primary";
    case "Financial Admin":
      return "bg-[#2A9D8F]/10 text-[#2A9D8F]";
    case "Researcher":
      return "bg-[#F59E0B]/10 text-[#F59E0B]";
    default:
      return "bg-muted text-muted-foreground";
  }
}

type Props = {
  filters?: { search: string; role: string };
  refreshKey?: number;
};

export function UsersGrid({ filters, refreshKey }: Props) {
  const { apiFetch } = useApi();
  const [users, setUsers] = React.useState<ApiUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.role && filters.role !== "all") params.set("role", filters.role);
        const res = await apiFetch(`/api/users${params.toString() ? `?${params.toString()}` : ""}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        const data = (await res.json()) as ApiUser[];
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setError(e instanceof Error ? e.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch, filters?.role, refreshKey]);

  const filtered = React.useMemo(() => {
    const q = filters?.search?.trim().toLowerCase() ?? "";
    if (!q) return users;
    return users.filter((u) =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      (Array.isArray(u.projects) ? u.projects.join(", ").toLowerCase().includes(q) : false)
    );
  }, [users, filters?.search]);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading team members…</p>;
  }

  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No team members found.</p>
      ) : filtered.map((user) => (
        <Card key={user.id} className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {user.avatar ?? user.name?.slice(0, 2)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeStyles(
                      user.role,
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FolderKanban className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="line-clamp-2">
                  {(Array.isArray(user.projects) ? user.projects : ["No Projects"]).join(", ")}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                View Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
