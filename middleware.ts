import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value
  const { pathname, searchParams } = request.nextUrl

  console.log("Middleware checking session:", session ? "exists" : "none")
  console.log("Current pathname:", pathname)

  const protectedPaths = ["/dashboard", "/profile"]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  // Nếu yêu cầu logout (có tham số query `logout=true`)
  if (searchParams.get("logout") === "true") {
    console.log("Logout request detected, clearing session")
    // Xoá cookie session trước khi redirect về sign-in
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    response.cookies.delete("session") // Xóa cookie session ở đây
    return response
  }

  // Nếu là trang sign-in mà đã có session → redirect về dashboard
  if (pathname === "/sign-in" && session) {
    console.log("Session exists, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Nếu là path được bảo vệ mà không có session → redirect về sign-in
  if (isProtectedPath && !session) {
    console.log("No session, redirecting to sign-in")
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  console.log("Middleware allowing request to continue")
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/profile/:path*", "/logout"],
}
