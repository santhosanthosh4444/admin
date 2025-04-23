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

    // Extract user role and staff ID
    const { role, staffId } = session

    // Only project mentors should be able to approve logs
    if (role !== "PROJECT_MENTOR") {
      return NextResponse.json({ message: "Only project mentors can approve logs" }, { status: 403 })
    }

    // Parse request body
    const { log_id, approved, comments } = await request.json()

    if (log_id === undefined) {
      return NextResponse.json({ message: "Log ID is required" }, { status: 400 })
    }

    if (approved === undefined) {
      return NextResponse.json({ message: "Approval status is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, get the log to check if it belongs to a team mentored by this staff
    const { data: log, error: logError } = await supabase.from("logs").select("team_id").eq("id", log_id).single()

    if (logError) {
      console.error("Error fetching log:", logError)
      return NextResponse.json({ message: "Failed to fetch log" }, { status: 500 })
    }

    // Check if the log exists
    if (!log) {
      return NextResponse.json({ message: "Log not found" }, { status: 404 })
    }

    // Check if the mentor is assigned to this team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("mentor")
      .eq("team_id", log.team_id)
      .single()

    if (teamError) {
      console.error("Error fetching team:", teamError)
      return NextResponse.json({ message: "Failed to fetch team" }, { status: 500 })
    }

    if (team.mentor !== staffId) {
      return NextResponse.json({ message: "You are not the mentor for this team" }, { status: 403 })
    }

    // Update the log with the approval status and comments
    const updateData: { mentor_approved: boolean; comments?: string } = {
      mentor_approved: approved,
    }

    // Add comments if provided
    if (comments !== undefined) {
      updateData.comments = comments
    }

    const { data: updatedLog, error: updateError } = await supabase
      .from("logs")
      .update(updateData)
      .eq("id", log_id)
      .select()

    if (updateError) {
      console.error("Error updating log:", updateError)
      return NextResponse.json({ message: "Failed to update log" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Log ${approved ? "approved" : "rejected"} successfully`,
      log: updatedLog[0],
    })
  } catch (error) {
    console.error("Error in log approval API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
