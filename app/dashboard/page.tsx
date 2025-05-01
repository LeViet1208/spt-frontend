"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dashboard } from "@/components/dashboard"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Nếu đã load xong auth state và không có user, chuyển hướng đến trang đăng nhập
    if (!loading && !user) {
      router.push("/sign-in")
    }
  }, [user, loading, router])

  // Hiển thị loading hoặc dashboard tùy thuộc vào trạng thái auth
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Sẽ được chuyển hướng bởi useEffect
  }

  return <Dashboard />
}
