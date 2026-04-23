import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";

type ProjectStatus = "active" | "completed" | "closed";

type Researcher = {
  id: number;
  name: string;
  email: string;
  role: string;
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

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`http://localhost:4000/api/projects/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <DashboardLayout
        title="Project Details"
        subtitle="View project information and budget activity."
      >
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not load that project.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const project = await res.json();

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
              {project.researchers.map((researcher: Researcher) => (
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
              {project.line_items.map((item: any) => (
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
