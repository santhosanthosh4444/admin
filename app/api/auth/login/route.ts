import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query the staffs table for the user with matching email
    const { data: staff, error } = await supabase
      .from("staffs")
      .select("id, name, email, password, role, staff_id, department, section")
      .eq("email", email)
      .single()

    if (error || !staff) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // In a real application, you should NEVER store plain text passwords
    // This is just for demonstration - in production use bcrypt or similar
    if (staff.password !== password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Remove password from the user object before sending it back
    const { password: _, ...userWithoutPassword } = staff

    // Create a session object with additional user information
    const session = {
      userId: staff.id,
      staffId: staff.staff_id,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      section: staff.section,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    }

    // Set a session cookie that expires when the browser is closed (similar to sessionStorage)
    const cookieStore = await cookies()
    cookieStore.set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // No maxAge or expires means this is a session cookie that will be deleted when browser closes
    })

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
