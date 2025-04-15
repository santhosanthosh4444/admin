import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(request: Request) {
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

    // Extract user role and department
    const { role, department } = session

    // Only HODs can approve projects
    if (role !== "HOD") {
      return NextResponse.json({ message: "Only HODs can give final approval to projects" }, { status: 403 })
    }

    // Parse request body
    const { project_id, approved } = await request.json()

    if (!project_id) {
      return NextResponse.json({ message: "Project ID is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify that the project is in the HOD's department and has mentor approval
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        teams!inner (
          team_id,
          department
        )
      `)
      .eq("project_id", project_id)
      .single()

    if (projectError) {
      console.error("Error fetching project:", projectError)
      return NextResponse.json({ message: "Failed to fetch project" }, { status: 500 })
    }

    // Check if the project is in the HOD's department
    if (project.teams.department !== department) {
      return NextResponse.json({ message: "You can only approve projects in your department" }, { status: 403 })
    }

    // Check if the project has mentor approval
    if (!project.is_approved) {
      return NextResponse.json({ message: "Project must have mentor approval before HOD approval" }, { status: 400 })
    }

    // Update the project HOD approval status
    const { data, error } = await supabase
      .from("projects")
      .update({ is_hod_approved: approved })
      .eq("project_id", project_id)
      .select()

    if (error) {
      console.error("Error updating project HOD approval:", error)
      return NextResponse.json({ message: "Failed to update project HOD approval status" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Project ${approved ? "approved" : "unapproved"} by HOD successfully`,
      project: data[0],
    })
  } catch (error) {
    console.error("Error in project HOD approval API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
