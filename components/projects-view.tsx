"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, Info, ThumbsUp, AlertTriangle } from "lucide-react"
import { toast } from "react-hot-toast"
import { ProjectDetailsModal } from "@/components/project-details-modal"

interface Project {
  id: number
  project_id: string
  title: string | null
  team_id: string | null
  status: string | null
  is_approved: boolean | null
  is_hod_approved: boolean | null
  theme: string[] | null
  created_at: string
  team_name?: string | null
  team_department?: string | null
  team_section?: string | null
  mentor_name?: string | null
  mentor_id?: string | null
}

interface User {
  id?: number
  name?: string
  email?: string
  role?: string
  staff_id?: string
  department?: string
  section?: string
}

export interface ProjectsViewProps {
  user: User | null
}

export function ProjectsView({ user }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [approvalType, setApprovalType] = useState<"mentor" | "hod">("mentor")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  // Fetch projects data
  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      const data = await response.json()
      setProjects(data.projects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle opening the project details modal
  const handleOpenDetailsModal = (projectId: string) => {
    setSelectedProjectId(projectId)
    setIsDetailsModalOpen(true)
  }

  // Handle opening the approval dialog
  const handleOpenApprovalDialog = (project: Project, type: "mentor" | "hod") => {
    setSelectedProject(project)
    setApprovalType(type)
    setIsApprovalDialogOpen(true)
  }

  // Handle approving a project
  const handleApproveProject = async () => {
    if (!selectedProject) return

    setIsSubmitting(true)

    try {
      const endpoint = approvalType === "mentor" ? "/api/projects/approve-mentor" : "/api/projects/approve-hod"

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: selectedProject.project_id,
          approved: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${approvalType === "mentor" ? "mentor" : "HOD"} approve project`)
      }

      toast.success(`Project ${approvalType === "mentor" ? "mentor" : "HOD"} approval successful`)

      // Close dialog and refresh projects
      setIsApprovalDialogOpen(false)
      await fetchProjects()
    } catch (error) {
      console.error("Error approving project:", error)
      toast.error("Failed to approve project")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if user can approve as mentor (PROJECT_MENTOR and is the mentor of the project)
  const canApproveMentor = (project: Project) => {
    return user && user.role === "PROJECT_MENTOR" && project.mentor_id === user.staff_id && project.is_approved !== true
  }

  // Check if user can approve as HOD (HOD and project is in their department)
  const canApproveHOD = (project: Project) => {
    return (
      user &&
      user.role === "HOD" &&
      user.department === project.team_department &&
      project.is_approved === true &&
      project.is_hod_approved !== true
    )
  }

  // Get status badge for a project
  const getStatusBadge = (project: Project) => {
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

  // Render loading skeleton
  if (isLoading) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage and approve projects</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Projects List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">
          {user?.role === "HOD"
            ? `Projects in ${user.department} department`
            : user?.role === "CLASS_ADVISOR"
              ? `Projects in ${user.department} department, Section ${user.section}`
              : user?.role === "PROJECT_MENTOR"
                ? "Projects you are mentoring"
                : "Manage and approve projects"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No projects found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.role === "PROJECT_MENTOR"
                  ? "You are not currently mentoring any projects."
                  : user?.role === "CLASS_ADVISOR"
                    ? `There are no projects in ${user.department} department, Section ${user.section}.`
                    : "There are no projects available at the moment."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Project Title</TableHead>
                    <TableHead className="w-[15%]">Department</TableHead>
                    <TableHead className="w-[10%]">Section</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[15%]">Theme</TableHead>
                    <TableHead className="w-[20%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.project_id}>
                      <TableCell className="font-medium">{project.title || "Untitled Project"}</TableCell>
                      <TableCell>{project.team_department || "N/A"}</TableCell>
                      <TableCell>{project.team_section || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(project)}</TableCell>
                      <TableCell>
                        {project.theme && project.theme.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {project.theme.map((theme, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDetailsModal(project.project_id)}
                            title="View project details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>

                          {canApproveMentor(project) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleOpenApprovalDialog(project, "mentor")}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Mentor Approve
                            </Button>
                          )}

                          {canApproveHOD(project) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenApprovalDialog(project, "hod")}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              HOD Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        projectId={selectedProjectId}
      />

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{approvalType === "mentor" ? "Mentor Approval" : "HOD Approval"}</DialogTitle>
            <DialogDescription>
              {approvalType === "mentor"
                ? "Are you sure you want to approve this project as a mentor?"
                : "Are you sure you want to give final HOD approval for this project?"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">{selectedProject?.title || "Untitled Project"}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Department: {selectedProject?.team_department || "N/A"} • Section:{" "}
                {selectedProject?.team_section || "N/A"}
              </p>

              {approvalType === "hod" && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm text-amber-700">
                    This is the final approval. Once approved, the project will be fully approved and cannot be changed.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveProject}
              disabled={isSubmitting}
              className={approvalType === "mentor" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isSubmitting ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
