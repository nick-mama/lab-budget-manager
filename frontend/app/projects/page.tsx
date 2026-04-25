import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ProjectsView } from "@/components/projects/projects-view";

export default function ProjectsPage() {
  return (
    <DashboardLayout
      title="Projects"
      subtitle="Manage your lab projects and track their progress."
    >
      <ProjectsView />
    </DashboardLayout>
  );
}