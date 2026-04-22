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
import { MoreHorizontal, Eye } from "lucide-react";
import Link from "next/link";
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
  loading?: boolean;
}

export function ProjectsTable({ projects, loading }: ProjectsTableProps) {
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
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="text-muted-foreground h-4 w-4" />
                      </Button>
                    </div>
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
