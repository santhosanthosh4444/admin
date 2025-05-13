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

    // Extract user role and staff ID
    const { role, staffId } = session

    // Only project mentors should see pending logs
    if (role !== "PROJECT_MENTOR") {
      return NextResponse.json({ message: "Only project mentors can view pending logs" }, { status: 403 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, get all teams mentored by this staff
    const { data: mentorTeams, error: teamsError } = await supabase
      .from("teams")
      .select("team_id")
      .eq("mentor", staffId)

    if (teamsError) {
      console.error("Error fetching mentor teams:", teamsError)
      return NextResponse.json({ message: "Failed to fetch mentor teams" }, { status: 500 })
    }

    // If no teams found, return empty array
    if (!mentorTeams || mentorTeams.length === 0) {
      return NextResponse.json({ logs: [] })
    }

    // Get team IDs
    const teamIds = mentorTeams.map((team) => team.team_id)

    // Fetch logs that need approval (mentor_approved is null) for these teams
    const { data: logs, error: logsError } = await supabase
      .from("logs")
      .select(`
        *,
        students:student_id (
          student_id,
          name,
          department,
          section
        ),
        teams:team_id (
          team_id,
          theme,
          code
        )
      `)
      .in("team_id", teamIds)
      .is("mentor_approved", null)
      .order("created_at", { ascending: false })

    if (logsError) {
      console.error("Error fetching logs:", logsError)
      return NextResponse.json({ message: "Failed to fetch logs" }, { status: 500 })
    }

    // Transform the data to a more usable format
    const transformedLogs = logs.map((log) => ({
      id: log.id,
      created_at: log.created_at,
      date: log.date,
      expected_task: log.expected_task,
      completed_task: log.completed_task,
      comments: log.comments,
      student_id: log.student_id,
      student_name: log.students?.name ?? "Unknown Student",
      team_id: log.team_id,
      team_topic: log.teams?.topic,
      team_code: log.teams?.code,
    }))

    return NextResponse.json({
      logs: transformedLogs,
    })
  } catch (error) {
    console.error("Error in pending logs API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
