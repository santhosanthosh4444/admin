import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(request: Request) {
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

    // Extract user role and staff ID
    const { role, staffId } = session

    // Parse request body
    const { review_id, result, is_completed } = await request.json()

    if (!review_id) {
      return NextResponse.json({ message: "Review ID is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if the user has permission to update this review
    if (role === "PROJECT_MENTOR" && staffId) {
      // For mentors, verify they are assigned to the team being reviewed
      const { data: review } = await supabase.from("reviews").select("team_id").eq("id", review_id).single()

      if (review) {
        const { data: team } = await supabase.from("teams").select("mentor").eq("team_id", review.team_id).single()

        if (!team || team.mentor !== staffId) {
          return NextResponse.json({ message: "You are not authorized to update this review" }, { status: 403 })
        }
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (result !== undefined) {
      updateData.result = result
    }

    if (is_completed !== undefined) {
      updateData.is_completed = is_completed

      // If marking as completed, set the completed_on date
      if (is_completed) {
        updateData.completed_on = new Date().toISOString()
      }
    }

    // Update the review
    const { data, error } = await supabase.from("reviews").update(updateData).eq("id", review_id).select()

    if (error) {
      console.error("Error updating review:", error)
      return NextResponse.json({ message: "Failed to update review" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Review updated successfully",
      review: data[0],
    })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
