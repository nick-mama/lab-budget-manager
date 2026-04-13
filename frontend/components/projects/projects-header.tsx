"use client";

import { useEffect, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Filter } from "lucide-react";
import { useApi } from "@/lib/api-client";

type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

interface ProjectsHeaderProps {
  onProjectCreated?: () => void;
}

export function ProjectsHeader({ onProjectCreated }: ProjectsHeaderProps) {
  const { apiFetch, userId } = useApi();
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState<ApiUser[]>([]);
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/users");
        if (!res.ok) throw new Error("Could not load users");
        const users = (await res.json()) as ApiUser[];
        if (cancelled) return;
        setManagers(users.filter((u) => u.role === "Lab Manager"));
      } catch {
        if (!cancelled) setManagers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function resetForm() {
    setName("");
    setManagerId("");
    setStartDate("");
    setEndDate("");
    setBudget("");
    setStatus("active");
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!userId) {
      setFormError("Choose an active user in the top bar first.");
      return;
    }
    if (!name.trim() || !managerId || !startDate || !endDate || budget === "") {
      setFormError("Fill in all required fields.");
      return;
    }
    const budgetNum = Number(budget);
    if (Number.isNaN(budgetNum) || budgetNum < 0) {
      setFormError("Budget must be a valid non-negative number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          manager_id: Number(managerId),
          start_date: startDate,
          end_date: endDate,
          budget: budgetNum,
          status,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Could not create project",
        );
      }
      setOpen(false);
      resetForm();
      onProjectCreated?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="bg-card pl-9"
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0" type="button">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Add a project and assign a lab manager. Project code is assigned
                automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formError ? (
                <p className="text-destructive text-sm" role="alert">
                  {formError}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="project-name">Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-card"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>Lab manager</Label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger className="bg-card w-full">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {open && managers.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No lab managers found. Add a user with role Lab Manager first.
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-card w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
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
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
