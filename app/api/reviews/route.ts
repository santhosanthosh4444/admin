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

    // Extract user role, department, section, and staff ID
    const { role, department, section, staffId } = session

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Base query to fetch reviews
    let query = supabase.from("reviews").select("*")

    // Apply role-based filtering
    if (role === "HOD") {
      // HOD can see all reviews in their department
      if (department) {
        query = query.eq("department", department)
      }
    } else if (role === "CLASS_ADVISOR") {
      // Class Advisor can see reviews in their department and section
      if (department && section) {
        query = query.eq("department", department).eq("section", section)
      } else if (department) {
        query = query.eq("department", department)
      }
    } else if (role === "PROJECT_MENTOR") {
      // For PROJECT_MENTOR, we need to get teams they mentor first, then filter reviews
      if (staffId) {
        const { data: mentorTeams } = await supabase.from("teams").select("team_id").eq("mentor", staffId)

        if (mentorTeams && mentorTeams.length > 0) {
          const teamIds = mentorTeams.map((team) => team.team_id)
          query = query.in("team_id", teamIds)
        } else {
          // If mentor has no teams, return empty array
          return NextResponse.json({ reviews: [] })
        }
      }
    }

    // Execute the query
    const { data: reviews, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json({ message: "Failed to fetch reviews" }, { status: 500 })
    }

    // Fetch attachments for each review
    const transformedReviews = await Promise.all(
      reviews.map(async (review) => {
        let teamInfo = {
          topic: null,
          code: null,
          team_lead: null,
          team_lead_name: null,
          section: null,
        }

        // Fetch team information if team_id exists
        if (review.team_id) {
          const { data: teamData } = await supabase
            .from("teams")
            .select("topic, code, team_lead, section")
            .eq("team_id", review.team_id)
            .single()

          if (teamData) {
            teamInfo = {
              ...teamInfo,
              topic: teamData.topic,
              code: teamData.code,
              team_lead: teamData.team_lead,
              section: teamData.section,
            }

            // Fetch team lead name if team_lead exists
            if (teamData.team_lead) {
              const { data: studentData } = await supabase
                .from("students")
                .select("name")
                .eq("student_id", teamData.team_lead)
                .single()

              teamInfo.team_lead_name = studentData?.name || null
            }
          }
        }

        // Fetch attachments for this review
        const { data: attachments, error: attachmentsError } = await supabase
          .from("review_attachments")
          .select("*")
          .eq("review_id", review.id)
          .order("created_at", { ascending: false })

        if (attachmentsError) {
          console.error("Error fetching review attachments:", attachmentsError)
        }

        return {
          id: review.id,
          team_id: review.team_id,
          stage: review.stage,
          department: review.department,
          is_completed: review.is_completed,
          completed_on: review.completed_on,
          result: review.result,
          created_at: review.created_at,
          team_topic: teamInfo.topic,
          team_code: teamInfo.code,
          team_section: teamInfo.section,
          team_lead_id: teamInfo.team_lead,
          team_lead_name: teamInfo.team_lead_name,
          attachments: attachments || [],
        }
      }),
    )

    return NextResponse.json({
      reviews: transformedReviews,
    })
  } catch (error) {
    console.error("Error in reviews API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
