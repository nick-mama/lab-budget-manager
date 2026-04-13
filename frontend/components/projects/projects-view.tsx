"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectsHeader } from "@/components/projects/projects-header";
import { ProjectsTable } from "@/components/projects/projects-table";
import { useApi } from "@/lib/api-client";

export type ApiProject = {
  id: number;
  project_code: string;
  name: string;
  manager_id: number;
  manager_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  line_item_count: number;
  status: string;
  created_at?: string;
};

export function ProjectsView() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { apiFetch } = useApi();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/projects");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const data = (await res.json()) as ApiProject[];
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {error ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <ProjectsHeader onProjectCreated={load} />
      <div className="mt-6">
        <ProjectsTable projects={projects} loading={loading} />
      </div>
    </>
  );
}
