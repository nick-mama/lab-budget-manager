import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SettingsForm } from "@/components/settings/settings-form"

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your account and system preferences."
    >
      <SettingsForm />
    </DashboardLayout>
  )
}
