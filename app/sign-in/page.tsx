"use client"

import Cookies from "js-cookie"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart } from "lucide-react"

export default function SignIn() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const [didRedirect, setDidRedirect] = useState(false)
  const router = useRouter()

  // Kiểm tra nếu người dùng đã đăng nhập, chuyển hướng đến dashboard
  // useEffect(() => {
  //   // Chỉ chuyển hướng khi đã load xong auth state và user tồn tại
  //   if (!authLoading && user && !didRedirect) {
  //     console.log("User detected in useEffect, redirecting to dashboard...")
  //     setDidRedirect(true)
  //     // Sử dụng window.location để tránh vấn đề với Next.js router
  //     window.location.href = "/dashboard"
  //   }
  // }, [user, authLoading, router])

  const handleGoogleSignIn = async () => {
    console.log("Sign-in button clicked")
    setError("")
    setLoading(true)

    try {
      await signInWithGoogle()
      // useEffect sẽ xử lý chuyển hướng
      const sessionToken = "real-session-token"
      const res = await fetch("/api/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      })
      if (!res.ok) {
        throw new Error("Không thể set session từ server")
      }
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error in handleGoogleSignIn:", error)
      setError(error.message || "Không thể đăng nhập với Google")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <ShoppingCart className="h-8 w-8 mr-2" />
            <span className="text-2xl font-bold">RetailAnalytics</span>
          </div>
          <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">
            Đăng nhập bằng tài khoản Google của bạn để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
          >
            {loading ? (
              "Đang đăng nhập..."
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                Đăng nhập với Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
