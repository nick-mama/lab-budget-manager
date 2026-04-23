"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiProject } from "@/components/projects/projects-view";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type ProjectStatus = "active" | "completed" | "closed";

function normalizeStatus(s: string): ProjectStatus {
  if (s === "completed" || s === "closed") return s;
  return "active";
}

interface ProjectsTableProps {
  projects: ApiProject[];
  setProjects: React.Dispatch<React.SetStateAction<ApiProject[]>>;
  loading?: boolean;
}

export function ProjectsTable({
  projects,
  setProjects,
  loading,
}: ProjectsTableProps) {
  const router = useRouter();

  async function handleDelete(projectId: number) {
    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:4000/api/projects/${projectId}`,
        {
          method: "DELETE",
          // In a real app, you'd get the user ID from auth context or cookies
          headers: {
            // to test if working, change this ID to 5 to delete any project (Financial Admin ID)
            // Ex: "x-user-id": "5",
            // Any other user ID will only be able to delete projects they manage
            "x-user-id": "5",
          },
        },
      );

      if (!res.ok) throw new Error("Delete failed");

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  }

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">
                Project ID
              </TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">
                Lab Manager
              </TableHead>
              <TableHead className="text-muted-foreground">
                Start Date
              </TableHead>
              <TableHead className="text-muted-foreground">End Date</TableHead>
              <TableHead className="text-muted-foreground">Budget</TableHead>
              <TableHead className="text-muted-foreground">Spent</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-muted-foreground h-24 text-center"
                >
                  No projects yet. Create one with New Project.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="border-border">
                  <TableCell className="text-accent font-medium">
                    {project.project_code}
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {project.name}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {project.manager_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.start_date}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.end_date}
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {formatUsd(Number(project.budget))}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatUsd(Number(project.spent))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={normalizeStatus(project.status)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="text-muted-foreground h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/projects/${project.id}/edit`)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
