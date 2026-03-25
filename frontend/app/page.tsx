import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { BudgetChart } from "@/components/dashboard/budget-chart"
import { SpendingTrends } from "@/components/dashboard/spending-trends"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { FolderKanban, Wallet, FileText, Users } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back! Here's an overview of your lab's finances."
    >
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Projects"
          value="12"
          change="+2 from last month"
          changeType="positive"
          icon={FolderKanban}
        />
        <StatsCard
          title="Total Budget"
          value="$740,000"
          change="Across all projects"
          changeType="neutral"
          icon={Wallet}
        />
        <StatsCard
          title="Pending Requests"
          value="8"
          change="Awaiting review"
          changeType="neutral"
          icon={FileText}
        />
        <StatsCard
          title="Team Members"
          value="24"
          change="+3 new researchers"
          changeType="positive"
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BudgetChart />
        <SpendingTrends />
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <RecentActivity />
      </div>
    </DashboardLayout>
  )
}
