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

// Sample project data
const projects = [
  {
    id: "PRJ-001",
    name: "Biotech Lab Development",
    manager: "Nick Mamaoag",
    startDate: "2024-03-01",
    endDate: "2025-06-30",
    budget: "$200,000",
    spent: "$145,000",
    status: "active" as const,
  },
  {
    id: "PRJ-002",
    name: "Quantum Computing Lab",
    manager: "Camden Forbes",
    startDate: "2023-09-01",
    endDate: "2024-09-01",
    budget: "$180,000",
    spent: "$156,000",
    status: "completed" as const,
  },
  {
    id: "PRJ-003",
    name: "Neural Networks Study",
    manager: "Geoffrey Agustin",
    startDate: "2023-06-01",
    endDate: "2024-06-01",
    budget: "$85,000",
    spent: "$85,000",
    status: "closed" as const,
  },
];

export function ProjectsTable() {
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
            {projects.map((project) => (
              <TableRow key={project.id} className="border-border">
                <TableCell className="font-medium text-accent">
                  {project.id}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {project.name}
                </TableCell>
                <TableCell className="text-foreground">
                  {project.manager}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {project.startDate}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {project.endDate}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {project.budget}
                </TableCell>
                <TableCell className="text-foreground">
                  {project.spent}
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
