"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Project = {
  id: number;
  name: string;
  manager_id: number;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
};

export default function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: project.name,
    manager_id: project.manager_id,
    start_date: project.start_date.slice(0, 10),
    end_date: project.end_date.slice(0, 10),
    budget: Number(project.budget),
    status: project.status,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
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

      router.push("/projects");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {/* Name */}
      <div>
        <label className="block text-sm mb-1">Project Name</label>
        <input
          className="w-full border rounded p-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      {/* Manager ID */}
      <div>
        <label className="block text-sm mb-1">Manager ID</label>
        <input
          type="number"
          className="w-full border rounded p-2"
          value={form.manager_id}
          onChange={(e) =>
            setForm({ ...form, manager_id: Number(e.target.value) })
          }
        />
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm mb-1">Start Date</label>
        <input
          type="date"
          className="w-full border rounded p-2"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm mb-1">End Date</label>
        <input
          type="date"
          className="w-full border rounded p-2"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm mb-1">Budget</label>
        <input
          type="number"
          className="w-full border rounded p-2"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm mb-1">Status</label>
        <select
          className="w-full border rounded p-2"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="closed">closed</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button type="submit">Save Changes</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/projects")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
