import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const sessionCookie = (await cookies()).get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get("mentorId")

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse the session cookie to get user info
    const sessionData = JSON.parse(sessionCookie)
    const userRole = sessionData.role
    const userDepartment = sessionData.department
    const userSection = sessionData.section
    const userStaffId = sessionData.staff_id

    // Base query
    let query = supabase.from("teams").select(`
      *,
      students!teams_team_lead_fkey(name),
      staffs!teams_mentor_fkey(name)
    `)

    // Apply filters based on user role
    if (mentorId) {
      // If mentorId is provided, filter by that
      query = query.eq("mentor", mentorId)
    } else if (userRole === "PROJECT_MENTOR") {
      // Project mentors can only see teams they are mentoring
      query = query.eq("mentor", userStaffId)
    } else if (userRole === "CLASS_ADVISOR") {
      // Class advisors can see teams in their department and section
      query = query.eq("department", userDepartment).eq("section", userSection)
    } else if (userRole === "HOD") {
      // HODs can see all teams in their department
      query = query.eq("department", userDepartment)
    }

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching teams:", error)
      return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 })
    }

    // Process the data to extract team lead and mentor names
    const processedTeams = data.map((team) => {
      // Extract team lead name
      const teamLeadName = team.students?.length > 0 ? team.students[0].name : null

      // Extract mentor name
      const mentorName = team.staffs?.length > 0 ? team.staffs[0].name : null

      // Return processed team
      return {
        ...team,
        team_lead_name: teamLeadName,
        mentor_name: mentorName,
        students: undefined, // Remove the nested objects
        staffs: undefined,
      }
    })

    return NextResponse.json({
      teams: processedTeams,
    })
  } catch (error) {
    console.error("Error in teams API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
