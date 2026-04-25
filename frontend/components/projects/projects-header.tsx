"use client";

import * as React from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useApi } from "@/lib/api-client";

type ProjectFilters = {
  search: string;
  status: string;
  manager: string;
};

type Props = {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onCreated?: () => void;
};

export function ProjectsHeader({
  filters,
  onFiltersChange,
  onCreated,
}: Props) {
  const { user } = useCurrentUser();
  const { apiFetch } = useApi();

  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    start_date: "",
    end_date: "",
    budget: "",
    status: "active",
  });

  const canCreateProject =
    user?.role === "Lab Manager" || user?.role === "Financial Admin";

  function update<K extends keyof ProjectFilters>(
    key: K,
    value: ProjectFilters[K],
  ) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  function clearFilters() {
    onFiltersChange({
      search: "",
      status: "all",
      manager: "all",
    });
  }

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.manager !== "all";

  async function handleSubmit() {
    setError("");

    if (!user?.id) {
      setError("You must be logged in to create a project.");
      return;
    }

    if (!canCreateProject) {
      setError("Researchers cannot create projects.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.start_date ||
      !form.end_date ||
      !form.budget
    ) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          manager_id: user.id,
          start_date: form.start_date,
          end_date: form.end_date,
          budget: Number(form.budget),
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create project.");
        return;
      }

      setOpen(false);
      setForm({
        name: "",
        start_date: "",
        end_date: "",
        budget: "",
        status: "active",
      });
      onCreated?.();
    } catch (_err) {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter Projects
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-72 p-4">
              <DropdownMenuLabel className="px-0 pb-2">
                Filter Projects
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mb-4" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => update("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lab Manager</Label>
                  <Select
                    value={filters.manager}
                    onValueChange={(value) => update("manager", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Managers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Managers</SelectItem>
                      <SelectItem value="Nick Mamaoag">Nick Mamaoag</SelectItem>
                      <SelectItem value="Geoffrey Agustin">
                        Geoffrey Agustin
                      </SelectItem>
                      <SelectItem value="Mehak Jammu">Mehak Jammu</SelectItem>
                      <SelectItem value="Camden Forbes">Camden Forbes</SelectItem>
                      <SelectItem value="Christopher Velez">
                        Christopher Velez
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters ? (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {canCreateProject ? (
          <Button
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        ) : (
          <div title="Insufficient permissions">
            <Button
              disabled
              className="gap-2 bg-primary text-primary-foreground opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Label>Project Name</Label>
              <Input
                placeholder="e.g. AI Research Initiative"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Budget</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.budget}
                onChange={(e) =>
                  setForm({ ...form, budget: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}