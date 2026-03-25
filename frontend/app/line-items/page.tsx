import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LineItemsHeader } from "@/components/line-items/line-items-header"
import { LineItemsTable } from "@/components/line-items/line-items-table"
import { LineItemsStats } from "@/components/line-items/line-items-stats"

export default function LineItemsPage() {
  return (
    <DashboardLayout
      title="Line Items"
      subtitle="Manage expense requests, revenue entries, and reimbursements."
    >
      <LineItemsStats />
      <div className="mt-6">
        <LineItemsHeader />
      </div>
      <div className="mt-6">
        <LineItemsTable />
      </div>
    </DashboardLayout>
  )
}
