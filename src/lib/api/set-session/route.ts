import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Giả sử bạn muốn nhận session từ body
  const body = await request.json()
  const sessionToken = body.sessionToken || "real-session-token"

  const response = NextResponse.json({ success: true })

  // Set cookie từ server
  response.cookies.set("session", sessionToken, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 ngày
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
