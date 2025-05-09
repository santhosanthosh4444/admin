import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
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

    // Extract user role
    const { role } = session

    // Only HOD and PROJECT_MENTOR can upload templates
    if (!role.includes("HOD") && !role.includes("PROJECT_MENTOR")) {
      return NextResponse.json({ message: "Unauthorized: Insufficient permissions" }, { status: 403 })
    }

    // Parse request body
    const { name, link, review } = await request.json()

    if (!name || !link || !review) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert template into database
    const { data, error } = await supabase.from("review_templates").insert([{ name, link, review }]).select()

    if (error) {
      console.error("Error saving template:", error)
      return NextResponse.json({ message: "Failed to save template" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Template saved successfully",
      template: data[0],
    })
  } catch (error) {
    console.error("Error saving template:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Get session cookie to verify authentication
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse URL to get review parameter
    const { searchParams } = new URL(request.url)
    const review = searchParams.get("review")

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query to fetch templates
    let query = supabase.from("review_templates").select("*")

    // If review is specified, filter by it
    if (review) {
      query = query.eq("review", review)
    }

    // Order by creation date (newest first)
    query = query.order("created_at", { ascending: false })

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching templates:", error)
      return NextResponse.json({ message: "Failed to fetch templates" }, { status: 500 })
    }

    return NextResponse.json({
      templates: data,
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
