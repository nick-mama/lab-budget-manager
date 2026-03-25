import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { BudgetCards } from "@/components/budgets/budget-cards"
import { BudgetSummary } from "@/components/budgets/budget-summary"

export default function BudgetsPage() {
  return (
    <DashboardLayout
      title="Budgets"
      subtitle="Track and manage project budgets and financial allocations."
    >
      <BudgetSummary />
      <div className="mt-6">
        <BudgetCards />
      </div>
    </DashboardLayout>
  )
}
