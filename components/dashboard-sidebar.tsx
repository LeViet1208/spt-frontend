"use client"

import Cookies from "js-cookie"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ShoppingCart, LayoutDashboard, LineChart, Package, Users, Upload, Settings } from "lucide-react"
import type { DashboardPage } from "./dashboard"

interface DashboardSidebarProps {
  currentPage: DashboardPage
  setCurrentPage: (page: DashboardPage) => void
}

export function DashboardSidebar({ currentPage, setCurrentPage }: DashboardSidebarProps) {
  const { logOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logOut()
      Cookies.remove("session")
      router.push("/sign-in?logout=true")
      // Chuyển hướng sẽ được xử lý bởi middleware
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-6 w-6" />
          <span>RetailAnalytics</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <Button
            variant={currentPage === "overview" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setCurrentPage("overview")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Tổng quan
          </Button>
          <Button
            variant={currentPage === "sales" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setCurrentPage("sales")}
          >
            <LineChart className="mr-2 h-4 w-4" />
            Doanh số
          </Button>
          <Button
            variant={currentPage === "inventory" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setCurrentPage("inventory")}
          >
            <Package className="mr-2 h-4 w-4" />
            Hàng tồn kho
          </Button>
          <Button
            variant={currentPage === "customers" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setCurrentPage("customers")}
          >
            <Users className="mr-2 h-4 w-4" />
            Khách hàng
          </Button>
          <Button
            variant={currentPage === "import" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setCurrentPage("import")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Nhập dữ liệu
          </Button>
          <Button
            variant={currentPage === "settings" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setCurrentPage("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Cài đặt tài khoản
          </Button>
        </nav>
      </div>
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}
