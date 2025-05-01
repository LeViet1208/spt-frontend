import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Lấy token từ cookie
  const session = request.cookies.get("session")?.value
  console.log("Middleware checking session:", session ? "exists" : "none")

  // Đường dẫn hiện tại
  const { pathname } = request.nextUrl
  console.log("Current pathname:", pathname)

  // Các đường dẫn được bảo vệ cần đăng nhập
  const protectedPaths = ["/dashboard", "/profile"]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  // Nếu người dùng chưa đăng nhập và đang truy cập trang được bảo vệ
  if (!session && isProtectedPath) {
    console.log("No session, redirecting to sign-in")
    // Chuyển hướng đến trang đăng nhập
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  // Nếu người dùng đã đăng nhập và đang truy cập trang đăng nhập
  if (session && pathname === "/sign-in") {
    console.log("Session exists, redirecting to dashboard")
    // Chuyển hướng đến trang dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  console.log("Middleware allowing request to continue")
  return NextResponse.next()
}

// Chỉ áp dụng middleware cho các đường dẫn sau
export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/profile/:path*"],
}
