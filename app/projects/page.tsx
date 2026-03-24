import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProjectsTable } from "@/components/projects/projects-table"
import { ProjectsHeader } from "@/components/projects/projects-header"

export default function ProjectsPage() {
  return (
    <DashboardLayout
      title="Projects"
      subtitle="Manage your lab projects and track their progress."
    >
      <ProjectsHeader />
      <div className="mt-6">
        <ProjectsTable />
      </div>
    </DashboardLayout>
  )
}
