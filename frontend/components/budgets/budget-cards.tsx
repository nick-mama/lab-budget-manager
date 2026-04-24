"use client";

import { useEffect, useState } from "react";
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
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  canDeleteProject,
  canEditProject,
  canViewProject,
} from "@/lib/permissions";
import { useApi } from "@/lib/api-client";

type BudgetRecord = {
  id: number;
  project_id: number;
  project_name: string;
  project_code: string;
  manager_id: number;
  total_allocated_amount: number;
  remaining_balance: number;
  spent: number;
  line_item_count: number;
};

function formatUsd(n: number) {
  return `$${Number(n || 0).toLocaleString()}`;
}

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
  const { user: currentUser } = useCurrentUser();
  const { apiFetch } = useApi();

  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBudgets() {
      try {
        const res = await apiFetch("/api/budgets");

        if (!res.ok) {
          throw new Error("Failed to load budgets");
        }

        const data = await res.json();
        setBudgets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setBudgets([]);
      } finally {
        setLoading(false);
      }
    }

    loadBudgets();
  }, [currentUser]);

  async function handleDelete(projectId: number) {
    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setBudgets((prev) =>
        prev.filter((budget) => budget.project_id !== projectId),
      );
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading budgets...</p>;
  }

  if (budgets.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">No budgets found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => {
        const allocated = Number(budget.total_allocated_amount || 0);
        const remaining = Number(budget.remaining_balance || 0);

        // Use backend-calculated spent directly
        const spent = Math.max(0, Number(budget.spent || 0));

        const percentage =
          allocated > 0
            ? Math.min(Math.max(Math.round((spent / allocated) * 100), 0), 100)
            : 0;

        const status = getStatusText(percentage);

        return (
          <Card key={budget.id} className="bg-card">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {budget.project_name}
                </CardTitle>
                <p className="mt-1 text-sm text-accent">
                  <button
                    onClick={() =>
                      router.push(`/projects/${budget.project_id}`)
                    }
                    className="cursor-pointer hover:underline"
                  >
                    {budget.project_code}
                  </button>
                </p>
              </div>

              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    {canViewProject(currentUser) && (
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/projects/${budget.project_id}`)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Project
                      </DropdownMenuItem>
                    )}

                    {canEditProject(currentUser, {
                      id: budget.project_id,
                      manager_id: budget.manager_id,
                    }) && (
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/projects/${budget.project_id}/edit`)
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Project
                      </DropdownMenuItem>
                    )}

                    {canDeleteProject(currentUser, {
                      id: budget.project_id,
                      manager_id: budget.manager_id,
                    }) && (
                      <DropdownMenuItem
                        onClick={() => handleDelete(budget.project_id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Approved Spending
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
                      {budget.line_item_count ?? 0} line items
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg bg-secondary p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Allocated</span>
                    <span className="font-medium text-foreground">
                      {formatUsd(allocated)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Spent (approved)
                    </span>
                    <span className="font-medium text-foreground">
                      {formatUsd(spent)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Remaining balance
                    </span>
                    <span
                      className={`font-medium ${
                        remaining < 0 ? "text-[#D32F2F]" : "text-[#2E7D32]"
                      }`}
                    >
                      {formatUsd(remaining)}
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
