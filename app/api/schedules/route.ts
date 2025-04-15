import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    // Get session cookie to verify authentication
    const cookieStore = await cookies()
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
    const { role, department, staffId } = session

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Base query to fetch schedules
    let query = supabase.from("project_review").select("*")

    // Apply role-based filtering
    if (role === "HOD" || role === "CLASS_ADVISOR") {
      // HOD and Class Advisor can see schedules for their department
      if (department) {
        query = query.eq("department", department)
      }
    } else if (role === "PROJECT_MENTOR") {
      // For PROJECT_MENTOR, we need to get departments of teams they mentor
      if (staffId) {
        const { data: mentorTeams } = await supabase
          .from("teams")
          .select("department")
          .eq("mentor", staffId)
          .order("department")

        if (mentorTeams && mentorTeams.length > 0) {
          // Get unique departments
          const departments = [...new Set(mentorTeams.map((team) => team.department))]
          query = query.in("department", departments)
        } else {
          // If mentor has no teams, return empty array
          return NextResponse.json({ schedules: [] })
        }
      }
    }

    // Execute the query
    const { data: schedules, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching schedules:", error)
      return NextResponse.json({ message: "Failed to fetch schedules" }, { status: 500 })
    }

    return NextResponse.json({
      schedules,
    })
  } catch (error) {
    console.error("Error in schedules API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
