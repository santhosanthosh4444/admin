import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get team_id from URL
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("team_id")

    if (!teamId) {
      return NextResponse.json({ message: "Team ID is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch team details
    const { data: team, error: teamError } = await supabase.from("teams").select("*").eq("team_id", teamId).single()

    if (teamError) {
      console.error("Error fetching team details:", teamError)
      return NextResponse.json({ message: "Failed to fetch team details" }, { status: 500 })
    }

    // Fetch team lead details if available
    let teamLead = null
    if (team.team_lead) {
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", team.team_lead)
        .single()

      if (!studentError && studentData) {
        teamLead = studentData
      }
    }

    // Fetch mentor details if available
    let mentor = null
    if (team.mentor) {
      const { data: staffData, error: staffError } = await supabase
        .from("staffs")
        .select("id, name, email, role, staff_id, department, section")
        .eq("staff_id", team.mentor)
        .single()

      if (!staffError && staffData) {
        mentor = staffData
      }
    }

    // Fetch reviews for this team
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (reviewsError) {
      console.error("Error fetching team reviews:", reviewsError)
      // Continue without reviews data
    }

    // Fetch project review schedules for this team's department
    const { data: schedules, error: schedulesError } = await supabase
      .from("project_review")
      .select("*")
      .eq("department", team.department)
      .order("created_at", { ascending: false })

    if (schedulesError) {
      console.error("Error fetching project schedules:", schedulesError)
      // Continue without schedules data
    }

    return NextResponse.json({
      team,
      teamLead,
      mentor,
      reviews: reviews || [],
      schedules: schedules || [],
    })
  } catch (error) {
    console.error("Error in team details API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
