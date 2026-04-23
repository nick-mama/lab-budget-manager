"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";

type ChangeType = "positive" | "neutral" | "negative";

type BudgetProject = {
  id: number;
  budget: number;
  spent: number;
};

type LineItem = {
  amount: number;
  status: string;
  type: string;
};

type SummaryItem = {
  title: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: React.ComponentType<{ className?: string }>;
};

function formatUsd(n: number) {
  return `$${Number(n || 0).toLocaleString()}`;
}

export function BudgetSummary() {
  const [totals, setTotals] = useState({
    allocated: 0,
    spent: 0,
    remaining: 0,
    pendingExpenses: 0,
    pendingCount: 0,
    utilization: 0,
    remainingPercent: 0,
  });

  useEffect(() => {
    async function loadSummary() {
      try {
        const [projectsRes, lineItemsRes] = await Promise.all([
          fetch("http://localhost:4000/api/projects", {
            headers: { "x-user-id": "5" },
          }),
          fetch("http://localhost:4000/api/line-items", {
            headers: { "x-user-id": "5" },
          }),
        ]);

        const projects: BudgetProject[] = projectsRes.ok
          ? await projectsRes.json()
          : [];

        const lineItems: LineItem[] = lineItemsRes.ok
          ? await lineItemsRes.json()
          : [];

        const allocated = projects.reduce(
          (sum, project) => sum + Number(project.budget || 0),
          0,
        );

        const spent = projects.reduce(
          (sum, project) => sum + Number(project.spent || 0),
          0,
        );

        const remaining = allocated - spent;
        const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
        const remainingPercent =
          allocated > 0 ? (remaining / allocated) * 100 : 0;

        const pendingExpenseItems = lineItems.filter(
          (item) => item.type === "expense" && item.status === "pending",
        );

        const pendingExpenses = pendingExpenseItems.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        );

        setTotals({
          allocated,
          spent,
          remaining,
          pendingExpenses,
          pendingCount: pendingExpenseItems.length,
          utilization,
          remainingPercent,
        });
      } catch (error) {
        console.error(error);
      }
    }

    loadSummary();
  }, []);

  const summaryItems: SummaryItem[] = [
    {
      title: "Total Allocated",
      value: formatUsd(totals.allocated),
      change: `${totals.allocated > 0 ? "+" : ""}0%`,
      changeType: "positive",
      icon: DollarSign,
    },
    {
      title: "Total Spent",
      value: formatUsd(totals.spent),
      change: `${totals.utilization.toFixed(1)}% utilized`,
      changeType: totals.utilization >= 90 ? "negative" : "neutral",
      icon: TrendingUp,
    },
    {
      title: "Remaining Balance",
      value: formatUsd(totals.remaining),
      change: `${totals.remainingPercent.toFixed(1)}% available`,
      changeType: totals.remaining < 0 ? "negative" : "positive",
      icon: PiggyBank,
    },
    {
      title: "Pending Expenses",
      value: formatUsd(totals.pendingExpenses),
      change: `${totals.pendingCount} requests`,
      changeType: "neutral",
      icon: TrendingDown,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item) => (
        <Card key={item.title} className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {item.value}
                </p>
                <p
                  className={`text-sm ${
                    item.changeType === "positive"
                      ? "text-[#2E7D32]"
                      : item.changeType === "negative"
                        ? "text-[#D32F2F]"
                        : "text-muted-foreground"
                  }`}
                >
                  {item.change}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
