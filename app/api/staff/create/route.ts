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
    const { name, email, password, role, department, section, domain, ie_allocated = false } = await request.json()

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["PROJECT_MENTOR", "CLASS_ADVISOR", "HOD", "HOD+PROJECT_MENTOR", "CLASS_ADVISOR+PROJECT_MENTOR"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    // Validate department if role includes HOD or CLASS_ADVISOR
    if ((role.includes("HOD") || role.includes("CLASS_ADVISOR")) && !department) {
      return NextResponse.json({ message: "Department is required for HOD and CLASS_ADVISOR roles" }, { status: 400 })
    }

    // Validate section if role includes CLASS_ADVISOR
    if (role.includes("CLASS_ADVISOR") && !section) {
      return NextResponse.json({ message: "Section is required for CLASS_ADVISOR role" }, { status: 400 })
    }

    // Validate domain if role includes PROJECT_MENTOR
    if (role.includes("PROJECT_MENTOR") && !domain) {
      return NextResponse.json({ message: "Domain is required for PROJECT_MENTOR role" }, { status: 400 })
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
          name, // Use the provided name
          email,
          password, // In production, hash this password
          role,
          department: "CSE",
          section:"B",
          domain, // Add domain field
          ie_allocated,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating staff:", error)
      return NextResponse.json({ message: "Failed to create staff account: " + error.message }, { status: 500 })
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
