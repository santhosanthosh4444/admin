"use client"

import { useState, useEffect, SetStateAction } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, X, FileText } from "lucide-react"
import { toast } from "react-hot-toast"

interface Log {
  id: number
  created_at: string
  date: string | null
  expected_task: string | null
  completed_task: string | null
  comments: string | null
  student_id: string
  student_name: string
  student_email: string | null
  team_id: string
  team_topic: string | null
  team_code: string | null
}

export function PendingLogsView() {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch logs on component mount
  useEffect(() => {
    fetchPendingLogs()
  }, [])

  // Fetch pending logs
  const fetchPendingLogs = async () => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
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

      // Refresh the logs list
      await fetchPendingLogs()
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

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Logs</CardTitle>
          <CardDescription>Student logs awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Logs</CardTitle>
        <CardDescription>Student logs awaiting your approval</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No pending logs</h3>
            <p className="text-sm text-muted-foreground">
              There are no student logs waiting for your approval at the moment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Expected Task</TableHead>
                  <TableHead>Completed Task</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.student_name}</p>
                        {log.student_email && <p className="text-xs text-muted-foreground">{log.student_email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.team_topic ? (
                        <div>
                          <p>{log.team_topic}</p>
                          {log.team_code && <p className="text-xs text-muted-foreground">Code: {log.team_code}</p>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unknown Team</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={log.expected_task || ""}>
                        {log.expected_task || <span className="text-muted-foreground italic">Not specified</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={log.completed_task || ""}>
                        {log.completed_task || <span className="text-muted-foreground italic">Not specified</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleOpenApprovalDialog(log)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setComments(e.target.value)}
                  placeholder="Add your comments or feedback here..."
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
