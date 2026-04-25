"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api-client";

type ProjectStatus = "active" | "completed" | "closed";

type Researcher = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type LineItem = {
  id: number;
  description: string;
  item_code: string;
  requestor_name: string;
  type: string;
  amount: number;
  status: string;
};

type ProjectDetails = {
  id: number;
  name: string;
  project_code: string;
  manager_name: string;
  start_date: string;
  end_date: string;
  status: string;
  budget: number;
  spent: number;
  researchers?: Researcher[];
  line_items?: LineItem[];
};

function normalizeStatus(s: string): ProjectStatus {
  if (s === "completed" || s === "closed") return s;
  return "active";
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { apiFetch } = useApi();

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        setLoading(true);
        setStatusCode(null);

        const res = await apiFetch(`/api/projects/${id}`);

        if (!res.ok) {
          if (!cancelled) {
            setProject(null);
            setStatusCode(res.status);
          }
          return;
        }

        const data = (await res.json()) as ProjectDetails;

        if (!cancelled) {
          setProject(data);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setProject(null);
          setStatusCode(500);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [apiFetch, id]);

  if (loading) {
    return (
      <DashboardLayout
        title="Project Details"
        subtitle="View project information and budget activity."
      >
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Loading project...</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we load that project.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    const title =
      statusCode === 401
        ? "Unauthorized"
        : statusCode === 403
          ? "Access denied"
          : "Project not found";

    const message =
      statusCode === 401
        ? "Please sign in again to view this project."
        : statusCode === 403
          ? "You do not have permission to view this project."
          : "We could not load that project.";

    return (
      <DashboardLayout
        title="Project Details"
        subtitle="View project information and budget activity."
      >
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/projects")}
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={project.name}
      subtitle={`Project details for ${project.project_code}`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Project Code</p>
              <p className="font-medium">{project.project_code}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Manager</p>
              <p className="font-medium">{project.manager_name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(project.start_date)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{formatDate(project.end_date)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="pt-1">
                <StatusBadge status={normalizeStatus(project.status)} />
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Line Items</p>
              <p className="font-medium">{project.line_items?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Allocated</p>
              <p className="text-2xl font-bold">
                {formatUsd(Number(project.budget || 0))}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-xl font-semibold">
                {formatUsd(Number(project.spent || 0))}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-semibold text-[#2E7D32]">
                {formatUsd(
                  Number(project.budget || 0) - Number(project.spent || 0),
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Researchers</CardTitle>
        </CardHeader>
        <CardContent>
          {!project.researchers || project.researchers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No researchers assigned to this project.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {project.researchers.map((researcher) => (
                <div key={researcher.id} className="rounded-lg border p-4">
                  <p className="font-medium text-foreground">
                    {researcher.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {researcher.email}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {researcher.role}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {!project.line_items || project.line_items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No line items for this project yet.
            </p>
          ) : (
            <div className="space-y-3">
              {project.line_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.item_code} • {item.requestor_name} • {item.type}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">
                      {formatUsd(Number(item.amount || 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}