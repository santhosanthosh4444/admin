"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { Copy, Check } from "lucide-react"

// Constants
const DEPARTMENTS = ["CSE", "ECE", "IT", "MECH", "CSBS", "AIDS"]
const SECTIONS = ["A", "B"]
const DOMAINS = [
  "Web Development",
  "Mobile App Development",
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Cloud Computing",
  "Cybersecurity",
  "IoT",
  "Blockchain",
  "AR/VR",
  "Robotics",
  "Embedded Systems",
  "Network Security",
  "Database Management",
  "DevOps",
  "UI/UX Design",
  "Game Development",
  "Big Data Analytics",
  "Natural Language Processing",
  "Computer Vision",
]

export interface StaffCredentials {
  name: string
  email: string
  password: string
  role: string
  department?: string | null
  section?: string | null
  domain?: string | null
}

export function AddStaffView() {
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false)
  const [credentials, setCredentials] = useState<StaffCredentials | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [department, setDepartment] = useState("")
  const [section, setSection] = useState("")
  const [domain, setDomain] = useState("")
  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!name || !email || !role) {
      toast.error("Please fill in all required fields")
      return
    }

    // Role-specific validation
    if (role.includes("HOD") && !department) {
      toast.error("Please select a department")
      return
    }

    if (role.includes("CLASS_ADVISOR") && (!department || !section)) {
      toast.error("Please select both department and section")
      return
    }

    // Domain validation for PROJECT_MENTOR
    if (role.includes("PROJECT_MENTOR") && !domain) {
      toast.error("Please select a domain for the project mentor")
      return
    }

    setIsAddingStaff(true)

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
          department: role.includes("HOD") || role.includes("CLASS_ADVISOR") ? department : null,
          section: role.includes("CLASS_ADVISOR") ? section : null,
          domain, // Always include domain
          ie_allocated: false, // Default value
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create staff account")
      }

      toast.success("Staff account created successfully")

      // Update credentials and show dialog
      setCredentials({
        name,
        email,
        password: generatedPassword,
        role,
        department: role.includes("HOD") || role.includes("CLASS_ADVISOR") ? department : null,
        section: role.includes("CLASS_ADVISOR") ? section : null,
        domain, // Include domain in credentials
      })
      setIsAddStaffDialogOpen(true)

      // Reset the form
      setName("")
      setEmail("")
      setRole("")
      setDepartment("")
      setSection("")
      setDomain("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsAddingStaff(false)
    }
  }

  const copyToClipboard = () => {
    if (!credentials) return

    const text = `
Name: ${credentials.name}
Email: ${credentials.email}
Password: ${credentials.password}
Role: ${credentials.role}
${credentials.department ? `Department: ${credentials.department}` : ""}
${credentials.section ? `Section: ${credentials.section}` : ""}
${credentials.domain ? `Domain: ${credentials.domain}` : ""}
    `.trim()

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Determine if department field should be shown
  const showDepartment = role.includes("HOD") || role.includes("CLASS_ADVISOR")

  // Determine if section field should be shown
  const showSection = role.includes("CLASS_ADVISOR")

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Staff</h1>
        <p className="text-muted-foreground">Create a new staff account with generated credentials</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff Information</CardTitle>
            <CardDescription>
              Enter the staff details. A secure password will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStaffSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isAddingStaff}
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
                  disabled={isAddingStaff}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={isAddingStaff} required>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROJECT_MENTOR">Project Mentor</SelectItem>
                    <SelectItem value="CLASS_ADVISOR">Class Advisor</SelectItem>
                    <SelectItem value="HOD">Head of Department</SelectItem>
                    <SelectItem value="HOD+PROJECT_MENTOR">HOD + Project Mentor</SelectItem>
                    <SelectItem value="CLASS_ADVISOR+PROJECT_MENTOR">Class Advisor + Project Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showDepartment && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment} disabled={isAddingStaff} required>
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
                  <Select value={section} onValueChange={setSection} disabled={isAddingStaff} required>
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

              <div className="space-y-2">
                <Label htmlFor="domain">Domain Expertise</Label>
                <Select
                  value={domain}
                  onValueChange={setDomain}
                  disabled={isAddingStaff}
                  required={role.includes("PROJECT_MENTOR")}
                >
                  <SelectTrigger id="domain">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((dom) => (
                      <SelectItem key={dom} value={dom}>
                        {dom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {role.includes("PROJECT_MENTOR") && (
                  <p className="text-xs text-muted-foreground mt-1">Required for Project Mentors</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isAddingStaff}>
                {isAddingStaff ? "Creating..." : "Create Staff Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>How to add a new staff member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">1. Enter Personal Details</h3>
              <p className="text-sm text-muted-foreground">
                Provide the staff member's full name and email address. The email will be used as their username.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">2. Select Role</h3>
              <p className="text-sm text-muted-foreground">Choose the appropriate role for the staff member:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>PROJECT_MENTOR: For staff mentoring student projects</li>
                <li>CLASS_ADVISOR: For staff serving as class advisors (requires department and section)</li>
                <li>HOD: For Heads of Department (requires department)</li>
                <li>Combined roles: Staff can have multiple roles (e.g., HOD + Project Mentor)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">3. Additional Information</h3>
              <p className="text-sm text-muted-foreground">
                Based on the selected role, you may need to provide additional information:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>For HOD: Select the department they will head</li>
                <li>For Class Advisor: Select both department and section they will advise</li>
                <li>For Project Mentor: Select their domain expertise</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">4. Save Credentials</h3>
              <p className="text-sm text-muted-foreground">
                After submission, you'll receive the generated credentials. Make sure to copy and share them securely
                with the staff member.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Account Created</DialogTitle>
            <DialogDescription>
              The staff account has been created successfully. Please save these credentials securely.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="flex items-center gap-2">
                  <Input id="name" value={credentials.name} readOnly className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Username)</Label>
                <div className="flex items-center gap-2">
                  <Input id="email" value={credentials.email} readOnly className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Generated Password</Label>
                <div className="flex items-center gap-2">
                  <Input id="password" value={credentials.password} readOnly className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="flex items-center gap-2">
                  <Input id="role" value={credentials.role} readOnly className="flex-1" />
                </div>
              </div>

              {credentials.department && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="flex items-center gap-2">
                    <Input id="department" value={credentials.department} readOnly className="flex-1" />
                  </div>
                </div>
              )}

              {credentials.section && (
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <div className="flex items-center gap-2">
                    <Input id="section" value={credentials.section} readOnly className="flex-1" />
                  </div>
                </div>
              )}

              {credentials.domain && (
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Expertise</Label>
                  <div className="flex items-center gap-2">
                    <Input id="domain" value={credentials.domain} readOnly className="flex-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Credentials
                </>
              )}
            </Button>

            <Button type="button" onClick={() => setIsAddStaffDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
