/* eslint-disable react/jsx-no-bind */
"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { UsersHeader } from "@/components/users/users-header";
import { UsersGrid } from "@/components/users/users-grid";

export default function UsersPage() {
  const [filters, setFilters] = React.useState({ search: "", role: "all" });
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <DashboardLayout
      title="Team Members"
      subtitle="Manage researchers, lab managers, and financial administrators."
    >
      <UsersHeader
        onFiltersChange={setFilters}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
      <div className="mt-6">
        <UsersGrid filters={filters} refreshKey={refreshKey} />
      </div>
    </DashboardLayout>
  );
}
