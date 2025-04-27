import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")

  // If the user is not logged in and trying to access a protected route
  if (
    !session &&
    !request.nextUrl.pathname.startsWith("/sign-in") &&
    !request.nextUrl.pathname.startsWith("/sign-up") &&
    !request.nextUrl.pathname.startsWith("/reset-password")
  ) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  // If the user is logged in and trying to access auth pages
  if (
    session &&
    (request.nextUrl.pathname.startsWith("/sign-in") ||
      request.nextUrl.pathname.startsWith("/sign-up") ||
      request.nextUrl.pathname.startsWith("/reset-password"))
  ) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
