import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body to get team_id
    const { teamId } = await request.json()

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

    // Fetch team members (students) - using the students table with team_id filter
    const { data: students, error: studentsError } = await supabase.from("students").select("*").eq("team_id", teamId)

    if (studentsError) {
      console.error("Error fetching team members:", studentsError)
      return NextResponse.json({ message: "Failed to fetch team members" }, { status: 500 })
    }

    // Fetch team lead details if available
    let teamLead = null
    if (team.team_lead) {
      const { data: teamLeadData, error: teamLeadError } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", team.team_lead)
        .single()

      if (!teamLeadError && teamLeadData) {
        teamLead = teamLeadData
      }
    }

    // Fetch mentor details if available
    let mentor = null
    if (team.mentor) {
      const { data: mentorData, error: mentorError } = await supabase
        .from("staffs")
        .select("*")
        .eq("staff_id", team.mentor)
        .single()

      if (!mentorError && mentorData) {
        mentor = mentorData
      }
    }

    // Fetch logs for this team
    const { data: logs, error: logsError } = await supabase
      .from("logs")
      .select("*, students!inner(*)")
      .eq("team_id", teamId)
      .order("date", { ascending: true })

    if (logsError) {
      console.error("Error fetching logs:", logsError)
      return NextResponse.json({ message: "Failed to fetch logs" }, { status: 500 })
    }

    // Fetch reviews for this team
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError)
      return NextResponse.json({ message: "Failed to fetch reviews" }, { status: 500 })
    }

    // Fetch project details if available
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle()

    if (projectError && projectError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine - team might not have a project yet
      console.error("Error fetching project details:", projectError)
    }

    return NextResponse.json({
      team,
      students: students || [],
      teamLead,
      mentor,
      logs: logs || [],
      reviews: reviews || [],
      project: project || null,
    })
  } catch (error) {
    console.error("Error in diary generation API:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
