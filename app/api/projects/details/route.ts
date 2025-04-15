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

    // Get project_id from URL
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")

    if (!projectId) {
      return NextResponse.json({ message: "Project ID is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .single()

    if (projectError) {
      console.error("Error fetching project details:", projectError)
      return NextResponse.json({ message: "Failed to fetch project details" }, { status: 500 })
    }

    // Fetch team details if available
    let team = null
    let teamLead = null
    let mentor = null
    let reviews = []

    if (project.team_id) {
      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", project.team_id)
        .single()

      if (!teamError && teamData) {
        team = teamData

        // Fetch team lead details if available
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
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("*")
          .eq("team_id", project.team_id)
          .order("created_at", { ascending: false })

        if (!reviewsError && reviewsData) {
          reviews = reviewsData
        }
      }
    }

    return NextResponse.json({
      project,
      team,
      teamLead,
      mentor,
      reviews,
    })
  } catch (error) {
    console.error("Error in project details API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
