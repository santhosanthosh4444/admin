import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(request: Request) {
  try {
    // Get session cookie to verify authentication
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse session to get user info
    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch (error) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    // Extract user role and department
    const { role, department } = session

    // Parse request body
    const { team_id, is_approved } = await request.json()

    if (!team_id) {
      return NextResponse.json({ message: "Team ID is required" }, { status: 400 })
    }

    if (typeof is_approved !== "boolean") {
      return NextResponse.json({ message: "Approval status must be a boolean" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if the user has permission to approve/reject teams (only HOD can do this)
    if (role !== "HOD") {
      return NextResponse.json({ message: "Only HODs can approve or reject teams" }, { status: 403 })
    }

    // Check if the team is in the HOD's department
    const { data: team } = await supabase.from("teams").select("department").eq("team_id", team_id).single()

    if (!team || team.department !== department) {
      return NextResponse.json(
        {
          message: "You can only approve or reject teams in your department",
        },
        { status: 403 },
      )
    }

    // Update the team's approval status
    const { data, error } = await supabase.from("teams").update({ is_approved }).eq("team_id", team_id).select()

    if (error) {
      console.error("Error updating team approval:", error)
      return NextResponse.json({ message: "Failed to update team approval status" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Team ${is_approved ? "approved" : "rejected"} successfully`,
      team: data[0],
    })
  } catch (error) {
    console.error("Error updating team approval:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
