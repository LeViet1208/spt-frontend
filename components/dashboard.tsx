"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { OverviewPage } from "@/components/pages/overview-page"
import { SalesPage } from "@/components/pages/sales-page"
import { InventoryPage } from "@/components/pages/inventory-page"
import { CustomersPage } from "@/components/pages/customers-page"
import { ImportPage } from "@/components/pages/import-page"
import { SettingsPage } from "@/components/pages/settings-page"

export type DashboardPage = "overview" | "sales" | "inventory" | "customers" | "import" | "settings"

export function Dashboard() {
  const [currentPage, setCurrentPage] = useState<DashboardPage>("overview")

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <DashboardSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <DashboardShell>
        {currentPage === "overview" && <OverviewPage />}
        {currentPage === "sales" && <SalesPage />}
        {currentPage === "inventory" && <InventoryPage />}
        {currentPage === "customers" && <CustomersPage />}
        {currentPage === "import" && <ImportPage />}
        {currentPage === "settings" && <SettingsPage />}
      </DashboardShell>
    </div>
  )
}
