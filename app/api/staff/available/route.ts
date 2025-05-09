import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    // Check if user is authenticated
    const sessionCookie = (await cookies()).get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Use a raw SQL query to count teams per mentor
    const { data: teamCounts, error: countError } = await supabase.rpc("count_teams_per_mentor")

    if (countError) {
      console.error("Error counting teams per mentor:", countError)
      return NextResponse.json({ message: "Failed to count teams per mentor" }, { status: 500 })
    }

    // Create a map of staff_id to team count
    const staffTeamCounts = new Map()
    if (teamCounts) {
      teamCounts.forEach((item: { mentor: string; count: number }) => {
        staffTeamCounts.set(item.mentor, item.count)
      })
    }

    // Fetch all staff members with their domain expertise
    const { data: allStaff, error: staffError } = await supabase.from("staffs").select("*").order("name")

    if (staffError) {
      console.error("Error fetching staff:", staffError)
      return NextResponse.json({ message: "Failed to fetch staff" }, { status: 500 })
    }

    // Filter staff members who have fewer than 2 teams
    // and add the team count to each staff member
    const availableStaff = allStaff
      .map((staff) => ({
        ...staff,
        team_count: staffTeamCounts.get(staff.staff_id) || 0,
      }))
      .filter((staff) => staff.team_count < 2)

    return NextResponse.json({
      staff: availableStaff,
    })
  } catch (error) {
    console.error("Error in available staff API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
