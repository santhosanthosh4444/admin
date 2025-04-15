import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Get session cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ message: "No active session" }, { status: 401 })
    }

    // Parse session
    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch (error) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    // Return session data (excluding sensitive information)
    return NextResponse.json({
      message: "Session retrieved successfully",
      session: {
        userId: session.userId,
        staffId: session.staffId,
        email: session.email,
        role: session.role,
        department: session.department,
        section: session.section,
      },
    })
  } catch (error) {
    console.error("Error retrieving session:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
