"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, CheckCircle, Clock, User, Users, FileText, AlertCircle } from "lucide-react"

interface TeamDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string | null
}

interface TeamDetails {
  team: {
    id: number
    team_id: string
    topic: string | null
    current_status: string | null
    is_approved: boolean | null
    code: string | null
    mentor: string | null
    team_lead: string | null
    department: string | null
    section: string | null
    created_at: string
  }
  teamLead: {
    id: number
    student_id: string
    name: string | null
    email: string | null
    department: string | null
    section: string | null
  } | null
  mentor: {
    id: number
    staff_id: string
    name: string | null
    email: string | null
    role: string | null
    department: string | null
    section: string | null
  } | null
  reviews: Array<{
    id: number
    team_id: string
    stage: string
    department: string
    is_completed: boolean
    completed_on: string | null
    result: string | null
    created_at: string
  }>
  schedules: Array<{
    id: number
    stage: string
    department: string
    start: string
    end: string
    created_at: string
  }>
}

export function TeamDetailsModal({ isOpen, onClose, teamId }: TeamDetailsModalProps) {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  // Fetch team details when the modal is opened and teamId changes
  useEffect(() => {
    if (isOpen && teamId) {
      fetchTeamDetails(teamId)
    } else {
      // Reset state when modal is closed
      setTeamDetails(null)
      setError(null)
    }
  }, [isOpen, teamId])

  const fetchTeamDetails = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/teams/details?team_id=${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch team details")
      }
      const data = await response.json()
      setTeamDetails(data)
    } catch (error) {
      console.error("Error fetching team details:", error)
      setError("Failed to load team details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Check if a schedule is active
  const isScheduleActive = (schedule: { start: string; end: string }) => {
    const now = new Date()
    const start = new Date(schedule.start)
    const end = new Date(schedule.end)
    return now >= start && now <= end
  }

  // Render loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Details</DialogTitle>
            <DialogDescription>Loading team information...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Render error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>An error occurred while loading team details</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-center text-muted-foreground">{error}</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // If no team details yet, show a placeholder
  if (!teamDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Details</DialogTitle>
            <DialogDescription>Loading team information...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const { team, teamLead, mentor, reviews, schedules } = teamDetails

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.topic || "Team"} {team.code && <span className="text-muted-foreground">({team.code})</span>}
          </DialogTitle>
          <DialogDescription>
            {team.department} Department {team.section && `• Section ${team.section}`} •{" "}
            {team.is_approved === true ? (
              <Badge >Approved</Badge>
            ) : team.is_approved === false ? (
              <Badge variant="destructive">Rejected</Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Topic</p>
                    <p>{team.topic || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Code</p>
                    <p>{team.code || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p>{team.department || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Section</p>
                    <p>{team.section || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p>
                      {team.is_approved === true
                        ? "Approved"
                        : team.is_approved === false
                          ? "Rejected"
                          : "Pending Approval"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created On</p>
                    <p>{formatDate(team.created_at)}</p>
                  </div>
                  {team.current_status && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                      <p>{team.current_status}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team Lead Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Team Lead
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamLead ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p>{teamLead.name || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{teamLead.email || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Department</p>
                        <p>{teamLead.department || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Section</p>
                        <p>{teamLead.section || "Not specified"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No team lead assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Mentor Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Project Mentor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mentor ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p>{mentor.name || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{mentor.email || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                        <p>{mentor.role || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Department</p>
                        <p>{mentor.department || "Not specified"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No mentor assigned</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Review History
                </CardTitle>
                <CardDescription>Performance reviews for this team</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No reviews found for this team</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Completed On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">{review.stage}</TableCell>
                          <TableCell>
                            {review.is_completed ? (
                              <Badge  className="flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                <span>Completed</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {review.result || <span className="text-muted-foreground italic">Not evaluated</span>}
                          </TableCell>
                          <TableCell>
                            {review.completed_on ? (
                              formatDate(review.completed_on)
                            ) : (
                              <span className="text-muted-foreground italic">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Department Schedules
                </CardTitle>
                <CardDescription>Review schedules for {team.department} department</CardDescription>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No schedules found for this department</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stage</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.stage}</TableCell>
                          <TableCell>{formatDate(schedule.start)}</TableCell>
                          <TableCell>{formatDate(schedule.end)}</TableCell>
                          <TableCell>
                            {isScheduleActive(schedule) ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit"
                              >
                                <Clock className="h-3 w-3" />
                                <span>Active</span>
                              </Badge>
                            ) : new Date(schedule.end) < new Date() ? (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                <span>Completed</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 w-fit"
                              >
                                <CalendarIcon className="h-3 w-3" />
                                <span>Upcoming</span>
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
