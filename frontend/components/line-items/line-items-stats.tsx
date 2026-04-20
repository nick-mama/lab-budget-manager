"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Wallet } from "lucide-react";
import { useApi } from "@/lib/api-client";

const STAT_CONFIG = [
  {
    key: "pending",
    title: "Pending",
    icon: Clock,
    color: "text-[#F59E0B]",
    bgColor: "bg-[#F59E0B]/10",
  },
  {
    key: "approved",
    title: "Approved",
    icon: CheckCircle,
    color: "text-[#2E7D32]",
    bgColor: "bg-[#2E7D32]/10",
  },
  {
    key: "rejected",
    title: "Rejected",
    icon: XCircle,
    color: "text-[#D32F2F]",
    bgColor: "bg-[#D32F2F]/10",
  },
  {
    key: "reimbursed",
    title: "Reimbursed",
    icon: Wallet,
    color: "text-[#2A9D8F]",
    bgColor: "bg-[#2A9D8F]/10",
  },
];

type StatsData = Record<string, { count: number; total: number }>;

export function LineItemsStats() {
  const { apiFetch } = useApi();
  const [stats, setStats] = React.useState<StatsData | null>(null);

  React.useEffect(() => {
    apiFetch("/api/dashboard/line-item-stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, [apiFetch]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {STAT_CONFIG.map((stat) => {
        const data = stats?.[stat.key];
        return (
          <Card key={stat.title} className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{data ? data.count : "—"}</p>
                  <p className="text-sm text-muted-foreground">{data ? `$${Number(data.total).toLocaleString()}` : ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}