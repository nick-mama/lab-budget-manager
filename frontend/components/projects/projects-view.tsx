"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type ProjectFilters = {
  search: string;
  status: string;
  manager: string;
};

export function ProjectsView() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { apiFetch } = useApi();

  const [filters, setFilters] = useState<ProjectFilters>({
    search: "",
    status: "all",
    manager: "all",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();

      if (filters.status !== "all") {
        query.set("status", filters.status);
      }

      const res = await apiFetch(
        `/api/projects${query.toString() ? `?${query.toString()}` : ""}`,
      );

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
  }, [apiFetch, filters.status]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredProjects = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !q ||
        project.name.toLowerCase().includes(q) ||
        project.project_code.toLowerCase().includes(q) ||
        project.manager_name.toLowerCase().includes(q);

      const matchesManager =
        filters.manager === "all" || project.manager_name === filters.manager;

      return matchesSearch && matchesManager;
    });
  }, [projects, filters.search, filters.manager]);

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <ProjectsHeader filters={filters} onFiltersChange={setFilters} />

      <div className="mt-6">
        <ProjectsTable
          projects={filteredProjects}
          setProjects={setProjects}
          loading={loading}
        />
      </div>
    </>
  );
}
