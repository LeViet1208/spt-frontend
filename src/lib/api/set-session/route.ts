import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionToken = body.sessionToken

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Session token is required" }, { status: 400 })
    }

    console.log("Received Firebase ID Token:", sessionToken.substring(0, 50) + "...")

    // Ở đây bạn có thể verify ID token với Firebase Admin SDK
    // const decodedToken = await admin.auth().verifyIdToken(sessionToken)
    // console.log("Decoded token:", decodedToken)

    const response = NextResponse.json({
      success: true,
      message: "Session created successfully",
    })

    // Set cookie với Firebase ID token
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 ngày
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return response
  } catch (error) {
    console.error("Error setting session:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
