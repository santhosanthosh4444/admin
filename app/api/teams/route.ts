import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse session to get user info
    let session
    try {
      session = JSON.parse(sessionCookie)
    } catch (error) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    // Extract user role, department, section, and staff ID
    const { role, department, section, staffId } = session

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Base query to fetch teams
    let query = supabase.from("teams").select("*")

    // Apply role-based filtering
    if (role === "HOD") {
      // HOD can see all teams in their department
      if (department) {
        query = query.eq("department", department)
      }
    } else if (role === "CLASS_ADVISOR") {
      // Class Advisor can see teams in their department and section
      if (department && section) {
        query = query.eq("department", department).eq("section", section)
      } else if (department) {
        query = query.eq("department", department)
      }
    } else if (role === "PROJECT_MENTOR") {
      // Project Mentor can only see teams they are mentoring
      if (staffId) {
        query = query.eq("mentor", staffId)
      }
    }

    // Execute the query
    const { data: teams, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching teams:", error)
      return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 })
    }

    // Fetch mentor names and team lead names separately
    const transformedTeams = await Promise.all(
      teams.map(async (team) => {
        let mentorName = null
        let teamLeadName = null

        // Fetch mentor name if mentor exists
        if (team.mentor) {
          const { data: mentorData } = await supabase.from("staffs").select("name").eq("staff_id", team.mentor).single()

          mentorName = mentorData?.name || null
        }

        // Fetch team lead name if team lead exists
        if (team.team_lead) {
          const { data: studentData } = await supabase
            .from("students")
            .select("name")
            .eq("student_id", team.team_lead)
            .single()

          teamLeadName = studentData?.name || null
        }

        return {
          ...team,
          mentor_name: mentorName,
          team_lead_name: teamLeadName,
        }
      }),
    )

    return NextResponse.json({
      teams: transformedTeams,
    })
  } catch (error) {
    console.error("Error in teams API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
