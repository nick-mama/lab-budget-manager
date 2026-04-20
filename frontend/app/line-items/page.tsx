"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { LineItemsHeader } from "@/components/line-items/line-items-header";
import { LineItemsTable } from "@/components/line-items/line-items-table";
import { LineItemsStats } from "@/components/line-items/line-items-stats";

export default function LineItemsPage() {
  const [filters, setFilters] = React.useState({
    search: "",
    status: "all-status",
    type: "all-type",
    project_id: "all-projects",
  });
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <DashboardLayout
      title="Line Items"
      subtitle="Manage expense requests, revenue entries, and reimbursements."
    >
      <LineItemsStats />
      <div className="mt-6">
        <LineItemsHeader
          onFiltersChange={setFilters}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <div className="mt-6">
        <LineItemsTable filters={filters} refreshKey={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />
      </div>
    </DashboardLayout>
  );
}