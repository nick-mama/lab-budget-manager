"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Project = {
  id: number;
  name: string;
  manager_id: number;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  status: string;
};

type User = {
  id: number;
  name: string;
  role: string;
};

type FormErrors = {
  name?: string;
  manager_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  status?: string;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: project.name,
    manager_id: project.manager_id,
    start_date: project.start_date.slice(0, 10),
    end_date: project.end_date.slice(0, 10),
    budget: Number(project.budget),
    status: project.status,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("http://localhost:4000/api/users", {
          headers: {
            "x-user-id": "5",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load users");
        }

        const data = await res.json();

        const managers = Array.isArray(data)
          ? data.filter(
              (user) =>
                user.role === "Lab Manager" || user.role === "Financial Admin",
            )
          : [];

        setUsers(managers);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  function validateForm() {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Project name is required.";
    }

    if (!form.manager_id) {
      newErrors.manager_id = "Manager is required.";
    }

    if (!form.start_date) {
      newErrors.start_date = "Start date is required.";
    }

    if (!form.end_date) {
      newErrors.end_date = "End date is required.";
    }

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      newErrors.end_date = "End date cannot be before start date.";
    }

    if (Number.isNaN(form.budget) || form.budget < 0) {
      newErrors.budget = "Budget must be 0 or greater.";
    }

    if (!["active", "completed", "closed"].includes(form.status)) {
      newErrors.status = "Choose a valid status.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const res = await fetch(
        `http://localhost:4000/api/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "5",
          },
          body: JSON.stringify(form),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Update failed");
      }

      toast.success("Project updated successfully.");

      setTimeout(() => {
        router.push("/projects");
        router.refresh();
      }, 800);
    } catch (error) {
      console.error(error);
      toast.error("Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Project</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name ? (
              <p className="text-sm text-red-600">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <select
              id="manager"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={form.manager_id}
              onChange={(e) =>
                setForm({ ...form, manager_id: Number(e.target.value) })
              }
              disabled={loadingUsers}
            >
              <option value="">Select a manager</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            {errors.manager_id ? (
              <p className="text-sm text-red-600">{errors.manager_id}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
              {errors.start_date ? (
                <p className="text-sm text-red-600">{errors.start_date}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
              {errors.end_date ? (
                <p className="text-sm text-red-600">{errors.end_date}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                value={form.budget}
                onChange={(e) =>
                  setForm({ ...form, budget: Number(e.target.value) })
                }
              />
              {errors.budget ? (
                <p className="text-sm text-red-600">{errors.budget}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="spent">Budget Spent</Label>
              <Input
                id="spent"
                value={formatUsd(Number(project.spent ?? 0))}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="closed">closed</option>
              </select>
              {errors.status ? (
                <p className="text-sm text-red-600">{errors.status}</p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/projects")}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
