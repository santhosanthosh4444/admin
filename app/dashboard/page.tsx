"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, Star, Home, LogOut, UserPlus, FolderKanban } from "lucide-react"
import { Toaster, toast } from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TeamsView } from "@/components/teams-view"
import { ReviewsView } from "@/components/reviews-view"
import { AddStaffView } from "@/components/add-staff-view"
import { ProjectsView } from "@/components/projects-view"

interface User {
  id: number
  name: string
  email: string
  role: string
  staff_id: string
  department: string
  section: string
}

export type ActiveView = "dashboard" | "teams" | "reviews" | "add-staff" | "projects"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>("dashboard")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [stage, setStage] = useState("")
  const [department, setDepartment] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const DEPARTMENTS = ["CSE", "ECE", "IT", "MECH", "CSBS", "AIDS"]
  const STAGES = ["Review 1", "Review 2", "Review 3", "Final Review"]

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // If user has a department, set it as the default
      if (parsedUser.department) {
        setDepartment(parsedUser.department)
      }
    } catch (error) {
      console.error("Failed to parse user data:", error)
      router.push("/")
    }
  }, [router])

  const handleLogout = async () => {
    try {
      // Call the logout API to clear the server-side session
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Clear client-side session storage
      sessionStorage.removeItem("user")

      toast.success("Logged out successfully")

      // Redirect to login page
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to log out")
    }
  }

  const handleScheduleSubmit = async () => {
    // Validate form
    if (!stage) {
      toast.error("Please select a stage")
      return
    }
    if (!department) {
      toast.error("Please select a department")
      return
    }
    if (!startDate) {
      toast.error("Please select a start date")
      return
    }
    if (!endDate) {
      toast.error("Please select an end date")
      return
    }

    // Validate that end date is after start date
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date")
      return
    }

    setIsSubmitting(true)

    try {
      // Send the data to the API
      const response = await fetch("/api/schedules/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage,
          department,
          start: startDate,
          end: endDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create schedule")
      }

      // Show success message with details about teams scheduled
      if (data.teamsScheduled === 0) {
        toast.success("Schedule created, but no approved teams found in this department")
      } else {
        toast.success(`Schedule created with ${data.teamsScheduled} teams scheduled for review`)
      }

      setIsScheduleDialogOpen(false)

      // Reset form
      setStage("")
      // Don't reset department as it's auto-filled
      setStartDate("")
      setEndDate("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create schedule")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  // Menu items for the sidebar
  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      view: "dashboard" as ActiveView,
    },
    {
      title: "Teams",
      icon: Users,
      view: "teams" as ActiveView,
    },
    {
      title: "Projects",
      icon: FolderKanban,
      view: "projects" as ActiveView,
    },
    {
      title: "Reviews",
      icon: Star,
      view: "reviews" as ActiveView,
    },
    {
      title: "Add Staff",
      icon: UserPlus,
      view: "add-staff" as ActiveView,
    },
  ]

  // Render the appropriate content based on the active view
  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <>
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user.name}</p>
              </div>
              <Button onClick={() => setIsScheduleDialogOpen(true)} className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Schedule Review
              </Button>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Staff Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p>{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <p>{user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Staff ID</p>
                    <p>{user.staff_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p>{user.department || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Section</p>
                    <p>{user.section || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )
      case "teams":
        return <TeamsView />
      case "reviews":
        return <ReviewsView />
      case "add-staff":
        return <AddStaffView />
      case "projects":
        return <ProjectsView user={user} />
      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center p-2">
              <SidebarTrigger className="md:hidden mr-2" />
              <h2 className="text-xl font-bold">Staff Portal</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === item.view}
                    onClick={() => setActiveView(item.view)}
                  >
                    <button>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 max-w-full">{renderContent()}</div>

          {/* Schedule Dialog */}
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Review</DialogTitle>
                <DialogDescription>Set up a review schedule for a department.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Review Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger id="stage">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user.department && department === user.department && (
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                  )}
                </div>

                {department && (
                  <div className="bg-muted p-3 rounded-md mt-2">
                    <p className="text-sm font-medium">Important Note:</p>
                    <p className="text-sm text-muted-foreground">
                      This will create review entries for all approved teams in the {department} department. Teams that
                      are not yet approved will not be included.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleScheduleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Toaster position="top-right" />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
