"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StaffCredentials } from "./add-staff-view"

interface AddStaffFormProps {
  onSuccess: (credentials: StaffCredentials) => void
}

const DEPARTMENTS = ["CSE", "ECE", "IT", "MECH", "CSBS", "AIDS"]
const SECTIONS = ["A", "B"]

export function AddStaffForm({ onSuccess }: AddStaffFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [department, setDepartment] = useState("")
  const [section, setSection] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Reset department and section when role changes
  useEffect(() => {
    setDepartment("")
    setSection("")
  }, [role])

  // Function to generate a secure random password
  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }

    return password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!email || !role) {
      toast.error("Please fill in all required fields")
      return
    }

    // Role-specific validation
    if (role === "HOD" && !department) {
      toast.error("Please select a department")
      return
    }

    if (role === "CLASS_ADVISOR" && (!department || !section)) {
      toast.error("Please select both department and section")
      return
    }

    setIsLoading(true)

    try {
      // Generate a secure password
      const generatedPassword = generatePassword()

      // Send the data to the API
      const response = await fetch("/api/staff/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password: generatedPassword,
          role,
          department: ["HOD", "CLASS_ADVISOR"].includes(role) ? department : null,
          section: role === "CLASS_ADVISOR" ? section : null,
          ie_allocated: false, // Default value
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create staff account")
      }

      toast.success("Staff account created successfully")

      // Call the success callback with the credentials
      onSuccess({
        name,
        email,
        password: generatedPassword,
        role,
        department: ["HOD", "CLASS_ADVISOR"].includes(role) ? department : null,
        section: role === "CLASS_ADVISOR" ? section : null,
      })

      // Reset the form
      setName("")
      setEmail("")
      setRole("")
      setDepartment("")
      setSection("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Determine if department field should be shown
  const showDepartment = role === "HOD" || role === "CLASS_ADVISOR"

  // Determine if section field should be shown
  const showSection = role === "CLASS_ADVISOR"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="name"
          placeholder="Mr. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="staff@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={setRole} disabled={isLoading} required>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PROJECT_MENTOR">Project Mentor</SelectItem>
            <SelectItem value="CLASS_ADVISOR">Class Advisor</SelectItem>
            <SelectItem value="HOD">Head of Department</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showDepartment && (
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select value={department} onValueChange={setDepartment} disabled={isLoading} required>
            <SelectTrigger id="department">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showSection && (
        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Select value={section} onValueChange={setSection} disabled={isLoading} required>
            <SelectTrigger id="section">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((sec) => (
                <SelectItem key={sec} value={sec}>
                  {sec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Staff Account"}
      </Button>
    </form>
  )
}
