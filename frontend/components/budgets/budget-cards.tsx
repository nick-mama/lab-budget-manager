"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample budget data
const budgets = [
  {
    id: "BDG-001",
    project: "Biotech Lab Development",
    projectId: 1,
    allocated: 200000,
    spent: 145000,
    remaining: 55000,
    lineItems: 38,
  },
  {
    id: "BDG-002",
    project: "AI Research Initiative",
    projectId: 4,
    allocated: 180000,
    spent: 156000,
    remaining: 24000,
    lineItems: 45,
  },
  {
    id: "BDG-003",
    project: "Neural Networks Study",
    projectId: 3,
    allocated: 85000,
    spent: 85000,
    remaining: 0,
    lineItems: 31,
  },
];

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-[#D32F2F]";
  if (percentage >= 75) return "bg-[#F59E0B]";
  return "bg-[#2A9D8F]";
}

function getStatusText(percentage: number): { text: string; color: string } {
  if (percentage >= 90) return { text: "Critical", color: "text-[#D32F2F]" };
  if (percentage >= 75) return { text: "Warning", color: "text-[#F59E0B]" };
  return { text: "Healthy", color: "text-[#2E7D32]" };
}

export function BudgetCards() {
  const router = useRouter();

  async function handleDelete(projectId: number) {
    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:4000/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": "5",
          },
        },
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => {
        const percentage = Math.round((budget.spent / budget.allocated) * 100);
        const status = getStatusText(percentage);

        return (
          <Card key={budget.id} className="bg-card">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {budget.project}
                </CardTitle>
                <p className="mt-1 text-sm text-accent">{budget.id}</p>
              </div>
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/projects/${budget.projectId}`)
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Project
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/projects/${budget.projectId}/edit`)
                      }
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleDelete(budget.projectId)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Budget Utilization
                    </span>
                    <span className={status.color}>{status.text}</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {percentage}% used
                    </span>
                    <span className="text-muted-foreground">
                      {budget.lineItems} line items
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 rounded-lg bg-secondary p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Allocated</span>
                    <span className="font-medium text-foreground">
                      ${budget.allocated.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium text-foreground">
                      ${budget.spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-[#2E7D32]">
                      ${budget.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
