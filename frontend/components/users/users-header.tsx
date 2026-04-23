"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useCurrentUserStore } from "@/lib/current-user-store";

type Role = "Researcher" | "Lab Manager" | "Financial Admin";

type Props = {
  onFiltersChange?: (filters: { search: string; role: string }) => void;
  onCreated?: () => void;
};

type CurrentUserResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function UsersHeader({ onFiltersChange, onCreated }: Props) {
  const { userId } = useCurrentUserStore();

  const [open, setOpen] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState("all");

  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(
    null,
  );

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<Role>("Researcher");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onFiltersChange?.({ search, role });
  }, [search, role, onFiltersChange]);

  React.useEffect(() => {
    if (!userId) {
      setCurrentUserRole(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/users/${userId}`, {
          headers: {
            "x-user-id": String(userId),
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load active user");
        }

        const u = (await res.json()) as CurrentUserResponse;

        if (!cancelled) {
          setCurrentUserRole(u.role ?? null);
        }
      } catch {
        if (!cancelled) {
          setCurrentUserRole(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const canCreate = currentUserRole === "Financial Admin";

  function resetForm() {
    setName("");
    setEmail("");
    setNewRole("Researcher");
    setSubmitting(false);
    setError(null);
  }

  async function handleCreate() {
    setError(null);

    if (!userId) {
      setError("Choose an active user in the top bar first.");
      return;
    }

    if (!canCreate) {
      setError("Only Financial Admin can add members.");
      return;
    }

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role: newRole,
        }),
      });

      const text = await res.text();
      let body: any = {};

      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }

      console.log("CREATE USER STATUS:", res.status);
      console.log("CREATE USER RESPONSE:", body || text);

      if (!res.ok) {
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : text || "Could not create user",
        );
      }

      setOpen(false);
      resetForm();
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search team members..."
            className="bg-card pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Researcher">Researcher</SelectItem>
            <SelectItem value="Lab Manager">Lab Manager</SelectItem>
            <SelectItem value="Financial Admin">Financial Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <Button
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          type="button"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>
              Creating users requires an active Financial Admin user.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          {!userId ? (
            <p className="text-muted-foreground text-sm">
              Pick an active user in the top bar to enable API actions.
            </p>
          ) : null}

          {userId && !canCreate ? (
            <p className="text-muted-foreground text-sm">
              Current role:{" "}
              <span className="font-medium text-foreground">
                {currentUserRole ?? "Unknown"}
              </span>
              . Only Financial Admin can add members.
            </p>
          ) : null}

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Name</Label>
              <Input
                id="new-user-name"
                className="bg-card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                className="bg-card"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as Role)}
              >
                <SelectTrigger className="bg-card w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Researcher">Researcher</SelectItem>
                  <SelectItem value="Lab Manager">Lab Manager</SelectItem>
                  <SelectItem value="Financial Admin">
                    Financial Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={submitting || !canCreate || !userId}
            >
              {submitting ? "Saving…" : "Create member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
