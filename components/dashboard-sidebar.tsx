"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart3, ShoppingCart, Package, Users, Upload, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DashboardPage } from "./dashboard"

interface DashboardSidebarProps {
  currentPage: DashboardPage
  setCurrentPage: (page: DashboardPage) => void
}

export function DashboardSidebar({ currentPage, setCurrentPage }: DashboardSidebarProps) {
  const router = useRouter()

  return (
    <div className="flex h-screen w-[240px] flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-6 w-6" />
          <span>RetailAnalytics</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          <Button
            variant={currentPage === "overview" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentPage("overview")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Tổng quan
          </Button>
          <Button
            variant={currentPage === "sales" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentPage("sales")}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Doanh số
          </Button>
          <Button
            variant={currentPage === "inventory" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentPage("inventory")}
          >
            <Package className="mr-2 h-4 w-4" />
            Hàng tồn kho
          </Button>
          <Button
            variant={currentPage === "customers" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentPage("customers")}
          >
            <Users className="mr-2 h-4 w-4" />
            Khách hàng
          </Button>
          <Button
            variant={currentPage === "import" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentPage("import")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Nhập dữ liệu
          </Button>
          <Button
            variant={currentPage === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentPage("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Cài đặt tài khoản
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
