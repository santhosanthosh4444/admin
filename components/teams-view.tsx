"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, UserPlus, Check, X, Info } from "lucide-react"
import { toast } from "react-hot-toast"
import { TeamDetailsModal } from "@/components/team-details-modal"

interface Team {
  id: number
  team_id: string
  topic: string | null
  current_status: string | null
  is_approved: boolean | null
  code: string | null
  mentor: string | null
  team_lead: string | null
  mentor_name?: string | null
  team_lead_name?: string | null
  department?: string | null
  section?: string | null
}

interface Staff {
  id: number
  staff_id: string
  name: string | null
  email: string | null
  role: string | null
  department: string | null
  section: string | null
  team_count: number
}

interface User {
  role: string
  department?: string
  section?: string
  staffId?: string
}

export function TeamsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
  const [isAssignMentorDialogOpen, setIsAssignMentorDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isAssigningMentor, setIsAssigningMentor] = useState(false)
  const [isUpdatingApproval, setIsUpdatingApproval] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  useEffect(() => {
    // Get user info from session storage
    const userData = sessionStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser({
          role: parsedUser.role,
          department: parsedUser.department,
          section: parsedUser.section,
          staffId: parsedUser.staff_id,
        })
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }

    fetchTeams()
  }, [])

  // Fetch teams data
  const fetchTeams = async () => {
    setIsLoadingTeams(true)
    try {
      const response = await fetch("/api/teams")
      if (!response.ok) {
        throw new Error("Failed to fetch teams")
      }
      const data = await response.json()
      setTeams(data.teams)
    } catch (error) {
      console.error("Error fetching teams:", error)
      toast.error("Failed to load teams")
    } finally {
      setIsLoadingTeams(false)
    }
  }

  // Fetch available staff (those with fewer than 2 teams)
  const fetchAvailableStaff = async () => {
    try {
      const response = await fetch("/api/staff/available")
      if (!response.ok) {
        throw new Error("Failed to fetch available staff")
      }
      const data = await response.json()
      setAvailableStaff(data.staff)
    } catch (error) {
      console.error("Error fetching available staff:", error)
      toast.error("Failed to load available staff")
    }
  }

  // Handle opening the assign mentor dialog
  const handleOpenAssignDialog = async (team: Team) => {
    setSelectedTeam(team)
    await fetchAvailableStaff()
    setIsAssignMentorDialogOpen(true)
  }

  // Handle opening the team details modal
  const handleOpenDetailsModal = (teamId: string) => {
    setSelectedTeamId(teamId)
    setIsDetailsModalOpen(true)
  }

  // Handle assigning a mentor to a team
  const handleAssignMentor = async (staff: Staff) => {
    if (!selectedTeam) return

    setIsAssigningMentor(true)

    try {
      const response = await fetch(`/api/teams/assign-mentor`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_id: selectedTeam.team_id,
          mentor_id: staff.staff_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign mentor")
      }

      toast.success(`${staff.name || staff.email} assigned as mentor`)

      // Close dialog and refresh teams
      setIsAssignMentorDialogOpen(false)
      await fetchTeams()
    } catch (error) {
      console.error("Error assigning mentor:", error)
      toast.error("Failed to assign mentor")
    } finally {
      setIsAssigningMentor(false)
    }
  }

  // Handle updating team approval status
  const handleApprovalUpdate = async (teamId: string, isApproved: boolean) => {
    setIsUpdatingApproval(teamId)

    try {
      const response = await fetch("/api/teams/update-approval", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_id: teamId,
          is_approved: isApproved,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update approval status")
      }

      toast.success(`Team ${isApproved ? "approved" : "rejected"} successfully`)

      // Update the teams list
      await fetchTeams()
    } catch (error) {
      console.error("Error updating approval:", error)
      toast.error("Failed to update approval status")
    } finally {
      setIsUpdatingApproval(null)
    }
  }

  // Check if user can assign mentors (HOD or Class Advisor)
  const canAssignMentor = user && (user.role === "HOD" || user.role === "CLASS_ADVISOR")

  // Check if user can approve/reject teams (HOD only)
  const canApproveTeams = user && user.role === "HOD"

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Teams</h1>
        <p className="text-muted-foreground">
          {user?.role === "HOD"
            ? `All teams in ${user.department} department`
            : user?.role === "CLASS_ADVISOR"
              ? `Teams in ${user.department} department, Section ${user.section}`
              : user?.role === "PROJECT_MENTOR"
                ? "Teams you are mentoring"
                : "Manage your teams"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTeams ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No teams found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.role === "PROJECT_MENTOR"
                  ? "You are not currently assigned as a mentor to any teams."
                  : user?.role === "CLASS_ADVISOR"
                    ? `There are no teams in ${user.department} department, Section ${user.section}.`
                    : "There are no teams available at the moment."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Topic</TableHead>
                    <TableHead className="w-[10%]">Code</TableHead>
                    {(user?.role === "HOD" || user?.role === "CLASS_ADVISOR") && (
                      <>
                        <TableHead className="w-[10%]">Department</TableHead>
                        {user?.role === "HOD" && <TableHead className="w-[10%]">Section</TableHead>}
                      </>
                    )}
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[15%]">Team Lead</TableHead>
                    <TableHead className="w-[15%]">Mentor</TableHead>
                    <TableHead className="w-[15%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{team.topic || "No topic"}</TableCell>
                      <TableCell>{team.code || "N/A"}</TableCell>
                      {(user?.role === "HOD" || user?.role === "CLASS_ADVISOR") && (
                        <>
                          <TableCell>{team.department || "N/A"}</TableCell>
                          {user?.role === "HOD" && <TableCell>{team.section || "N/A"}</TableCell>}
                        </>
                      )}
                      <TableCell>
                        {team.is_approved === true ? (
                          <Badge >Approved</Badge>
                        ) : team.is_approved === false ? (
                          <Badge variant="destructive">Rejected</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>{team.team_lead_name || "Unknown"}</TableCell>
                      <TableCell>
                        {team.mentor_name || <span className="text-muted-foreground italic">Not assigned</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDetailsModal(team.team_id)}
                            title="View team details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          
                          {canApproveTeams && team.is_approved === null && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprovalUpdate(team.team_id, true)}
                                disabled={isUpdatingApproval === team.team_id}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleApprovalUpdate(team.team_id, false)}
                                disabled={isUpdatingApproval === team.team_id}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {canAssignMentor && !team.mentor && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleOpenAssignDialog(team)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add Mentor
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

      {/* Assign Mentor Dialog */}
      <Dialog open={isAssignMentorDialogOpen} onOpenChange={setIsAssignMentorDialogOpen}>
        <DialogContent className="sm:max-w-md:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Mentor</DialogTitle>
            <DialogDescription>
              Select a staff member to assign as mentor for{" "}
              <span className="font-medium">{selectedTeam?.topic || "this team"}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {availableStaff.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-2 text-base font-medium">No available staff</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All staff members are already assigned to the maximum number of teams.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {availableStaff.map((staff) => (
                  <Card key={staff.staff_id} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div
                      className="flex justify-between items-center"
                      onClick={() => !isAssigningMentor && handleAssignMentor(staff)}
                    >
                      <div>
                        <h4 className="font-medium">{staff.name || staff.email}</h4>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>{staff.role}</span>
                          {staff.department && (
                            <>
                              <span>•</span>
                              <span>{staff.department}</span>
                            </>
                          )}
                          {staff.section && (
                            <>
                              <span>•</span>
                              <span>Section {staff.section}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{staff.team_count} / 2 teams</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full p-0 w-8 h-8"
                          disabled={isAssigningMentor}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssignMentor(staff)
                          }}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Details Modal */}
      <TeamDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        teamId={selectedTeamId} 
      />
    </>
  )
}
