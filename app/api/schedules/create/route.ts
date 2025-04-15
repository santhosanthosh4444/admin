import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    // Get session cookie to verify authentication
    const cookieStore = (await cookies())
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse session to get user info
    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch (error) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    // Extract user role and department
    const { role, department: userDepartment } = session

    // Parse request body
    const { stage, department, start, end } = await request.json()

    // Validate required fields
    if (!stage) {
      return NextResponse.json({ message: "Stage is required" }, { status: 400 })
    }
    if (!department) {
      return NextResponse.json({ message: "Department is required" }, { status: 400 })
    }
    if (!start) {
      return NextResponse.json({ message: "Start date is required" }, { status: 400 })
    }
    if (!end) {
      return NextResponse.json({ message: "End date is required" }, { status: 400 })
    }

    // Validate that end date is after start date
    if (new Date(end) <= new Date(start)) {
      return NextResponse.json({ message: "End date must be after start date" }, { status: 400 })
    }

    // Role-based permission check
    if (role === "HOD" && department !== userDepartment) {
      return NextResponse.json({ message: "You can only create schedules for your own department" }, { status: 403 })
    }

    if (role === "CLASS_ADVISOR" && department !== userDepartment) {
      return NextResponse.json({ message: "You can only create schedules for your own department" }, { status: 403 })
    }

    if (role === "PROJECT_MENTOR") {
      return NextResponse.json({ message: "Project mentors are not authorized to create schedules" }, { status: 403 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. First, insert the schedule into the project_review table
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("project_review")
      .insert({
        stage,
        department,
        start,
        end,
      })
      .select()

    if (scheduleError) {
      console.error("Error creating schedule:", scheduleError)
      return NextResponse.json({ message: "Failed to create schedule" }, { status: 500 })
    }

    // 2. Get all teams from the specified department that are approved
    let teamsQuery = supabase.from("teams").select("team_id").eq("department", department).eq("is_approved", true)

    // If user is a Class Advisor, also filter by section
    if (role === "CLASS_ADVISOR" && session.section) {
      teamsQuery = teamsQuery.eq("section", session.section)
    }

    const { data: teamsData, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ message: "Failed to fetch teams for review creation" }, { status: 500 })
    }

    // If no teams found, return success but with a warning
    if (!teamsData || teamsData.length === 0) {
      return NextResponse.json({
        message: "Schedule created successfully, but no approved teams found in this department",
        schedule: scheduleData[0],
        teamsScheduled: 0,
      })
    }

    // 3. Create review entries for each team
    const reviewEntries = teamsData.map((team) => ({
      team_id: team.team_id,
      stage,
      department,
      is_completed: false,
      completed_on: null,
      result: null,
    }))

    const { data: reviewsData, error: reviewsError } = await supabase.from("reviews").insert(reviewEntries).select()

    if (reviewsError) {
      console.error("Error creating review entries:", reviewsError)
      return NextResponse.json(
        {
          message: "Schedule created but failed to create all review entries",
          schedule: scheduleData[0],
          error: reviewsError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Schedule and review entries created successfully",
      schedule: scheduleData[0],
      teamsScheduled: teamsData.length,
      reviewsCreated: reviewsData.length,
    })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
