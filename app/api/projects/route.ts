import { createClient, SupabaseClient } from "@supabase/supabase-js"
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

    // Base query to fetch projects with role-based filtering
    const query = supabase.from("projects").select("*")

    // Apply role-based filtering
    if (role === "HOD") {
      // HOD can see all projects in their department
      // We need to join with teams to filter by department
      const { data: projects, error } = await supabase
        .from("projects")
        .select(`
          *,
          teams!inner (
            team_id,
            department,
            section,
            mentor,
            team_lead
          )
        `)
        .eq("teams.department", department)

      if (error) {
        console.error("Error fetching projects:", error)
        return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 })
      }

      // Enhance projects with team and mentor information
      const enhancedProjects = await enhanceProjectsWithDetails(supabase, projects)

      return NextResponse.json({
        projects: enhancedProjects,
      })
    } else if (role === "CLASS_ADVISOR") {
      // Class Advisor can see projects in their department and section
      const { data: projects, error } = await supabase
        .from("projects")
        .select(`
          *,
          teams!inner (
            team_id,
            department,
            section,
            mentor,
            team_lead
          )
        `)
        .eq("teams.department", department)
        .eq("teams.section", section)

      if (error) {
        console.error("Error fetching projects:", error)
        return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 })
      }

      // Enhance projects with team and mentor information
      const enhancedProjects = await enhanceProjectsWithDetails(supabase, projects)

      return NextResponse.json({
        projects: enhancedProjects,
      })
    } else if (role === "PROJECT_MENTOR") {
      // Project Mentor can only see projects they are mentoring
      const { data: projects, error } = await supabase
        .from("projects")
        .select(`
          *,
          teams!inner (
            team_id,
            department,
            section,
            mentor,
            team_lead
          )
        `)
        .eq("teams.mentor", staffId)

      if (error) {
        console.error("Error fetching projects:", error)
        return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 })
      }

      // Enhance projects with team and mentor information
      const enhancedProjects = await enhanceProjectsWithDetails(supabase, projects)

      return NextResponse.json({
        projects: enhancedProjects,
      })
    }

    // If no role-based filtering applied, return empty array
    return NextResponse.json({
      projects: [],
    })
  } catch (error) {
    console.error("Error in projects API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Helper function to enhance projects with team and mentor details
async function enhanceProjectsWithDetails(supabase: SupabaseClient<any, "public", any>, projects: any[]) {
  if (!projects || projects.length === 0) return []

  return Promise.all(
    projects.map(async (project) => {
      const team = project.teams

      // Get team lead name
      let teamLeadName = null
      if (team.team_lead) {
        const { data: studentData } = await supabase
          .from("students")
          .select("name")
          .eq("student_id", team.team_lead)
          .single()

        if (studentData) {
          teamLeadName = studentData.name
        }
      }

      // Get mentor name
      let mentorName = null
      if (team.mentor) {
        const { data: staffData } = await supabase.from("staffs").select("name").eq("staff_id", team.mentor).single()

        if (staffData) {
          mentorName = staffData.name
        }
      }

      return {
        ...project,
        team_department: team.department,
        team_section: team.section,
        team_lead_name: teamLeadName,
        mentor_name: mentorName,
        mentor_id: team.mentor,
      }
    }),
  )
}
