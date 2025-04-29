"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, User, Users, FileText, AlertCircle, Tag } from "lucide-react"

interface ProjectDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string | null
}

interface ProjectDetails {
  project: {
    id: number
    project_id: string
    title: string | null
    team_id: string | null
    status: string | null
    is_approved: boolean | null
    is_hod_approved: boolean | null
    theme: string[] | null
    created_at: string
  }
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
  } | null
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
    attachments?: Array<{
      id: number
      review_id: number
      attachment_name: string | null
      link: string | null
      created_at: string
    }>
    marks: number | null
  }>
}

export function ProjectDetailsModal({ isOpen, onClose, projectId }: ProjectDetailsModalProps) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  // Fetch project details when the modal is opened and projectId changes
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails(projectId)
    } else {
      // Reset state when modal is closed
      setProjectDetails(null)
      setError(null)
    }
  }, [isOpen, projectId])

  const fetchProjectDetails = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/details?project_id=${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch project details")
      }
      const data = await response.json()
      setProjectDetails(data)
    } catch (error) {
      console.error("Error fetching project details:", error)
      setError("Failed to load project details. Please try again.")
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

  // Render loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>Loading project information...</DialogDescription>
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
            <DialogDescription>An error occurred while loading project details</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-center text-muted-foreground">{error}</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // If no project details yet, show a placeholder
  if (!projectDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>Loading project information...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const { project, team, teamLead, mentor, reviews } = projectDetails

  // Get approval status badge
  const getApprovalBadge = () => {
    if (project.is_hod_approved) {
      return <Badge >Fully Approved</Badge>
    } else if (project.is_approved) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Mentor Approved
        </Badge>
      )
    } else {
      return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {project.title || "Untitled Project"}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {team?.department} Department {team?.section && `• Section ${team.section}`} • {getApprovalBadge()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Project</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Project Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Title</p>
                    <p>{project.title || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p>{project.status || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mentor Approval</p>
                    <p>{project.is_approved ? "Approved" : "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">HOD Approval</p>
                    <p>{project.is_hod_approved ? "Approved" : "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created On</p>
                    <p>{formatDate(project.created_at)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Themes</p>
                    {project.theme && project.theme.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.theme.map((theme, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No themes specified</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {mentor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Project Mentor
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            {team ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Team Topic</p>
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
                      {team.current_status && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                          <p>{team.current_status}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {teamLead && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Team Lead
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No team information available for this project</p>
              </div>
            )}
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
                        <TableHead>Marks</TableHead>
                        <TableHead>Completed On</TableHead>
                        <TableHead>Attachments</TableHead>
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
                            {review.marks !== null ? (
                              `${review.marks}/100`
                            ) : (
                              <span className="text-muted-foreground italic">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {review.completed_on ? (
                              formatDate(review.completed_on)
                            ) : (
                              <span className="text-muted-foreground italic">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {review.attachments && review.attachments.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {review.attachments.map((attachment) => (
                                  <div key={attachment.id} className="flex items-center">
                                    {attachment.link ? (
                                      <a
                                        href={attachment.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                      >
                                        {attachment.attachment_name || "View attachment"}
                                      </a>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        {attachment.attachment_name || "Unnamed attachment"}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">No attachments</span>
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
