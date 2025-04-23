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

    // Only project mentors should see students
    if (role !== "PROJECT_MENTOR") {
      return NextResponse.json({ message: "Only project mentors can view their students" }, { status: 403 })
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
      return NextResponse.json({ students: [] })
    }

    // Get team IDs
    const teamIds = mentorTeams.map((team) => team.team_id)

    // Get all unique student IDs from logs for these teams
    const { data: logStudents, error: logStudentsError } = await supabase
      .from("logs")
      .select("student_id")
      .in("team_id", teamIds)
      .order("student_id")

    if (logStudentsError) {
      console.error("Error fetching student IDs from logs:", logStudentsError)
      return NextResponse.json({ message: "Failed to fetch student IDs" }, { status: 500 })
    }

    // Extract unique student IDs
    const uniqueStudentIds = [...new Set(logStudents.map((log) => log.student_id))]

    // If no students found, return empty array
    if (uniqueStudentIds.length === 0) {
      return NextResponse.json({ students: [] })
    }

    // Fetch student details
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("student_id, name, department, section")
      .in("student_id", uniqueStudentIds)
      .order("name")

    if (studentsError) {
      console.error("Error fetching student details:", studentsError)
      return NextResponse.json({ message: "Failed to fetch student details" }, { status: 500 })
    }

    return NextResponse.json({
      students: students || [],
    })
  } catch (error) {
    console.error("Error in students API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
