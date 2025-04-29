"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, X, FileText } from "lucide-react"
import { toast } from "react-hot-toast"

interface Student {
  student_id: string
  name: string
  email: string | null
  department: string | null
  section: string | null
}

interface Log {
  id: number
  created_at: string
  date: string | null
  expected_task: string | null
  completed_task: string | null
  comments: string | null
  mentor_approved: boolean | null
  student_id: string
  student_name: string
  student_email: string | null
  team_id: string
  team_topic: string | null
  team_code: string | null
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

export interface LogsViewProps {
  user: User | null
}

export function LogsView({ user }: LogsViewProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all")
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user && user.role === "PROJECT_MENTOR") {
      fetchStudents()
      fetchPendingLogs()
    }
  }, [user])

  // Fetch students under the mentor
  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true)
      const response = await fetch("/api/logs/students")
      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }
      const data = await response.json()
      setStudents(data.students)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to load students")
    } finally {
      setIsLoadingStudents(false)
    }
  }

  // Fetch all pending logs
  const fetchPendingLogs = async () => {
    try {
      setIsLoadingLogs(true)
      const response = await fetch("/api/logs/pending")
      if (!response.ok) {
        throw new Error("Failed to fetch pending logs")
      }
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error("Error fetching pending logs:", error)
      toast.error("Failed to load pending logs")
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // Fetch logs for a specific student
  const fetchStudentLogs = async (studentId: string) => {
    try {
      setIsLoadingLogs(true)
      const response = await fetch(`/api/logs/student?student_id=${studentId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch student logs")
      }
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error("Error fetching student logs:", error)
      toast.error("Failed to load student logs")
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // Handle student selection change
  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value)
    if (value === "all") {
      fetchPendingLogs()
    } else {
      fetchStudentLogs(value)
    }
  }

  // Handle opening the approval dialog
  const handleOpenApprovalDialog = (log: Log) => {
    setSelectedLog(log)
    setComments(log.comments || "")
    setIsApprovalDialogOpen(true)
  }

  // Handle approving or rejecting a log
  const handleLogApproval = async (approved: boolean) => {
    if (!selectedLog) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/logs/approve", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          log_id: selectedLog.id,
          approved,
          comments,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update log approval status")
      }

      toast.success(`Log ${approved ? "approved" : "rejected"} successfully`)
      setIsApprovalDialogOpen(false)

      // Refresh the logs
      if (selectedStudentId === "all") {
        await fetchPendingLogs()
      } else {
        await fetchStudentLogs(selectedStudentId)
      }
    } catch (error) {
      console.error("Error updating log approval:", error)
      toast.error("Failed to update log approval status")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Check if user is a project mentor
  if (user?.role !== "PROJECT_MENTOR") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">Access Restricted</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Only project mentors can view and manage student logs.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Student Logs</h1>
        <p className="text-muted-foreground">View and manage student activity logs</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Select a student to view their logs or view all pending logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <Label htmlFor="student-select" className="mb-2 block">
                Student
              </Label>
              {isLoadingStudents ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedStudentId} onValueChange={handleStudentChange}>
                  <SelectTrigger id="student-select">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pending Logs</SelectItem>
                    {students.length === 0 ? (
                      <SelectItem value="no-students" disabled>
                        No students found
                      </SelectItem>
                    ) : (
                      students.map((student) => (
                        <SelectItem key={student.student_id} value={student.student_id}>
                          {student.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedStudentId === "all"
              ? "Pending Logs"
              : `Logs for ${students.find((s) => s.student_id === selectedStudentId)?.name || "Student"}`}
          </CardTitle>
          <CardDescription>
            {selectedStudentId === "all"
              ? "Student logs awaiting your approval"
              : "All activity logs for the selected student"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No logs found</h3>
              <p className="text-sm text-muted-foreground">
                {selectedStudentId === "all"
                  ? "There are no pending logs awaiting your approval."
                  : "The selected student has no activity logs."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {selectedStudentId === "all" && <TableHead>Student</TableHead>}
                    <TableHead>Expected Task</TableHead>
                    <TableHead>Completed Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.date)}</TableCell>
                      {selectedStudentId === "all" && (
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.student_name}</p>
                            {log.student_email && <p className="text-xs text-muted-foreground">{log.student_email}</p>}
                          </div>
                        </TableCell>
                      )}
                          <TableCell>
                        <div className="max-w-[200px] truncate" title={log.expected_task ?? ""}>
                          {log.expected_task || <span className="text-muted-foreground italic">Not specified</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={log.completed_task || ""}>
                          {log.completed_task || <span className="text-muted-foreground italic">Not specified</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.mentor_approved === true ? (
                          <Badge  className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Approved</span>
                          </Badge>
                        ) : log.mentor_approved === false ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <X className="h-3 w-3" />
                            <span>Rejected</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Pending</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleOpenApprovalDialog(log)}
                            disabled={log.mentor_approved !== null}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {log.mentor_approved === null ? "Review" : "View"}
                          </Button>
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

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Student Log</DialogTitle>
            <DialogDescription>Review and approve or reject this student log entry.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Student</Label>
                <p className="font-medium">{selectedLog?.student_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p>{selectedLog?.date ? formatDate(selectedLog.date) : "N/A"}</p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Expected Task</Label>
              <div className="p-2 bg-muted rounded-md mt-1 whitespace-pre-wrap">
                {selectedLog?.expected_task || "Not specified"}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Completed Task</Label>
              <div className="p-2 bg-muted rounded-md mt-1 whitespace-pre-wrap">
                {selectedLog?.completed_task || "Not specified"}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your comments or feedback here..."
                className="min-h-[100px]"
                disabled={selectedLog?.mentor_approved !== null}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {selectedLog?.mentor_approved === null ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
                  onClick={() => handleLogApproval(false)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsApprovalDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleLogApproval(true)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {isSubmitting ? "Saving..." : "Approve"}
                  </Button>
                </div>
              </>
            ) : (
              <Button type="button" onClick={() => setIsApprovalDialogOpen(false)} className="ml-auto">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
