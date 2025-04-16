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

    // Parse session to get user info
    let session
    try {
      session = JSON.parse(sessionCookie)
    } catch (error) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    // Extract user role and staff ID
    const { role, staffId } = session

    // Only project mentors can approve projects
    if (role !== "PROJECT_MENTOR") {
      return NextResponse.json({ message: "Only project mentors can approve projects" }, { status: 403 })
    }

    // Parse request body
    const { project_id, approved } = await request.json()

    if (!project_id) {
      return NextResponse.json({ message: "Project ID is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify that the user is the mentor of the project's team
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        teams!inner (
          team_id,
          mentor
        )
      `)
      .eq("project_id", project_id)
      .single()

    if (projectError) {
      console.error("Error fetching project:", projectError)
      return NextResponse.json({ message: "Failed to fetch project" }, { status: 500 })
    }

    // Check if the user is the mentor of the team
    if (project.teams.mentor !== staffId) {
      return NextResponse.json({ message: "You are not the mentor of this project's team" }, { status: 403 })
    }

    // Update the project approval status
    const { data, error } = await supabase
      .from("projects")
      .update({ is_approved: approved })
      .eq("project_id", project_id)
      .select()

    if (error) {
      console.error("Error updating project approval:", error)
      return NextResponse.json({ message: "Failed to update project approval status" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Project ${approved ? "approved" : "unapproved"} successfully`,
      project: data[0],
    })
  } catch (error) {
    console.error("Error in project mentor approval API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
