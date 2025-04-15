import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const sessionCookie = (await cookies()).get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse session to check role (optional: you might want to restrict staff creation to certain roles)
    try {
      const session = JSON.parse(sessionCookie)
      // Example: Check if user has admin role
      // if (session.role !== 'admin') {
      //   return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
      // }
    } catch (error) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    // Get request body
    const { name,email, password, role, department, section, ie_allocated = false } = await request.json()

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["PROJECT_MENTOR", "CLASS_ADVISOR", "HOD"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    // Validate department if role is HOD or CLASS_ADVISOR
    if ((role === "HOD" || role === "CLASS_ADVISOR") && !department) {
      return NextResponse.json({ message: "Department is required for HOD and CLASS_ADVISOR roles" }, { status: 400 })
    }

    // Validate section if role is CLASS_ADVISOR
    if (role === "CLASS_ADVISOR" && !section) {
      return NextResponse.json({ message: "Section is required for CLASS_ADVISOR role" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if email already exists
    const { data: existingStaff } = await supabase.from("staffs").select("id").eq("email", email).maybeSingle()

    if (existingStaff) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 })
    }

    // Insert new staff
    const { data, error } = await supabase
      .from("staffs")
      .insert([
        {
          name: name, // Default name from email
          email,
          password, // In production, hash this password
          role,
          department,
          section,
          ie_allocated,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating staff:", error)
      return NextResponse.json({ message: "Failed to create staff account" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Staff account created successfully",
      staff: data[0],
    })
  } catch (error) {
    console.error("Error in staff creation:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
