"use client"

import { BarChart3, Home, Package, ShoppingCart, Upload, Users } from "lucide-react"
import type { DashboardPage } from "@/components/dashboard"

interface DashboardSidebarProps {
  currentPage: DashboardPage
  setCurrentPage: (page: DashboardPage) => void
}

export function DashboardSidebar({ currentPage, setCurrentPage }: DashboardSidebarProps) {
  const menuItems = [
    {
      id: "overview" as DashboardPage,
      label: "Overview",
      icon: Home,
    },
    {
      id: "sales" as DashboardPage,
      label: "Sales",
      icon: BarChart3,
    },
    {
      id: "inventory" as DashboardPage,
      label: "Inventory",
      icon: Package,
    },
    {
      id: "customers" as DashboardPage,
      label: "Customers",
      icon: Users,
    },
    {
      id: "import" as DashboardPage,
      label: "Import Data",
      icon: Upload,
    },
  ]

  return (
    <div className="w-64 border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <ShoppingCart className="mr-2 h-6 w-6" />
        <span className="font-semibold">RetailAnalytics</span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              currentPage === item.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
