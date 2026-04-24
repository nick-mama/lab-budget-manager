"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { BudgetChart } from "@/components/dashboard/budget-chart";
import { SpendingTrends } from "@/components/dashboard/spending-trends";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { FolderKanban, Wallet, FileText, Users } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Active Projects" value="12" icon={FolderKanban} />
        <StatsCard title="Total Budget" value="$425,000" icon={Wallet} />
        <StatsCard title="Open Requests" value="18" icon={FileText} />
        <StatsCard title="Users" value="24" icon={Users} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BudgetChart />
        <SpendingTrends />
      </div>

      <div className="mt-6">
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
}