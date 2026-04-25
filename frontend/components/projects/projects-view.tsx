"use client";

import * as React from "react";
import { ProjectsHeader } from "@/components/projects/projects-header";
import { ProjectsTable } from "@/components/projects/projects-table";
import { useApi } from "@/lib/api-client";

export type ApiProject = {
  id: number;
  project_code: string;
  name: string;
  manager_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  status: string;
};

type Filters = {
  search: string;
  status: string;
  manager: string;
};

export function ProjectsView() {
  const { apiFetch } = useApi();

  const [projects, setProjects] = React.useState<ApiProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<Filters>({
    search: "",
    status: "all",
    manager: "all",
  });

  async function loadProjects() {
    try {
      setLoading(true);

      const res = await apiFetch("/api/projects");

      if (!res.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = React.useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !filters.search.trim() ||
        [
          project.name,
          project.project_code,
          project.manager_name,
          project.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" || project.status === filters.status;

      const matchesManager =
        filters.manager === "all" ||
        project.manager_name === filters.manager;

      return matchesSearch && matchesStatus && matchesManager;
    });
  }, [projects, filters]);

  return (
    <div className="space-y-6">
      <ProjectsHeader
        filters={filters}
        onFiltersChange={setFilters}
        onCreated={loadProjects}
      />

      <ProjectsTable
        projects={filteredProjects}
        setProjects={setProjects}
        loading={loading}
        onRefresh={loadProjects}
      />
    </div>
  );
}