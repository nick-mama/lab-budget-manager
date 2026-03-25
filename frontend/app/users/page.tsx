import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { UsersHeader } from "@/components/users/users-header"
import { UsersGrid } from "@/components/users/users-grid"

export default function UsersPage() {
  return (
    <DashboardLayout
      title="Team Members"
      subtitle="Manage researchers, lab managers, and financial administrators."
    >
      <UsersHeader />
      <div className="mt-6">
        <UsersGrid />
      </div>
    </DashboardLayout>
  )
}
