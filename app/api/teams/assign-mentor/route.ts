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

    // Extract user role
    const { role, department, section } = session

    // Parse request body
    const { team_id, mentor_id } = await request.json()

    if (!team_id || !mentor_id) {
      return NextResponse.json({ message: "Team ID and mentor ID are required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if the user has permission to assign mentors
    if (role !== "HOD" && role !== "CLASS_ADVISOR") {
      return NextResponse.json({ message: "You are not authorized to assign mentors" }, { status: 403 })
    }

    // If user is a Class Advisor, check if the team is in their department and section
    if (role === "CLASS_ADVISOR") {
      const { data: team } = await supabase.from("teams").select("department, section").eq("team_id", team_id).single()

      if (!team || team.department !== department || team.section !== section) {
        return NextResponse.json(
          {
            message: "You can only assign mentors to teams in your department and section",
          },
          { status: 403 },
        )
      }
    }

    // If user is a HOD, check if the team is in their department
    if (role === "HOD") {
      const { data: team } = await supabase.from("teams").select("department").eq("team_id", team_id).single()

      if (!team || team.department !== department) {
        return NextResponse.json(
          {
            message: "You can only assign mentors to teams in your department",
          },
          { status: 403 },
        )
      }
    }

    // Update the team with the mentor
    const { data, error } = await supabase.from("teams").update({ mentor: mentor_id }).eq("team_id", team_id).select()

    if (error) {
      console.error("Error assigning mentor:", error)
      return NextResponse.json({ message: "Failed to assign mentor" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Mentor assigned successfully",
      team: data[0],
    })
  } catch (error) {
    console.error("Error assigning mentor:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
