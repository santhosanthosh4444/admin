"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react"
import { toast } from "react-hot-toast"

interface Review {
  id: number
  team_id: string
  stage: string
  department: string
  is_completed: boolean
  completed_on: string | null
  result: string | null
  created_at: string
  team_name?: string
  team_topic?: string
  team_section?: string
  mentor_id?: string
  attachments?: Array<{
    id: number
    review_id: number
    attachment_name: string | null
    link: string | null
    created_at: string
  }>
}

interface Schedule {
  id: number
  stage: string
  department: string
  start: string
  end: string
  created_at: string
}

interface User {
  role: string
  department?: string
  section?: string
  staffId?: string
}

export function ReviewsView() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [result, setResult] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Get user info on component mount
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

    fetchReviews()
    fetchSchedules()
  }, [])

  // Fetch reviews data
  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews")
      if (!response.ok) {
        throw new Error("Failed to fetch reviews")
      }
      const data = await response.json()
      setReviews(data.reviews)
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch schedules data
  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules")
      if (!response.ok) {
        throw new Error("Failed to fetch schedules")
      }
      const data = await response.json()
      setSchedules(data.schedules)
    } catch (error) {
      console.error("Error fetching schedules:", error)
      toast.error("Failed to load schedules")
    }
  }

  // Handle opening the update review dialog
  const handleOpenUpdateDialog = (review: Review) => {
    setSelectedReview(review)
    setResult(review.result || "")
    setIsUpdateDialogOpen(true)
  }

  // Handle updating a review
  const handleUpdateReview = async () => {
    if (!selectedReview) return
    if (!result) {
      toast.error("Please enter a result")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/reviews/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          review_id: selectedReview.id,
          result,
          is_completed: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update review")
      }

      toast.success("Review updated successfully")
      setIsUpdateDialogOpen(false)
      await fetchReviews() // Refresh the reviews list
    } catch (error) {
      console.error("Error updating review:", error)
      toast.error("Failed to update review")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group reviews by stage
  const reviewsByStage = reviews.reduce(
    (acc, review) => {
      const stage = review.stage || "Unknown"
      if (!acc[stage]) {
        acc[stage] = []
      }
      acc[stage].push(review)
      return acc
    },
    {} as Record<string, Review[]>,
  )

  // Find active schedules (current date is between start and end)
  const activeSchedules = schedules.filter((schedule) => {
    const now = new Date()
    const start = new Date(schedule.start)
    const end = new Date(schedule.end)
    return now >= start && now <= end
  })

  // Check if user can evaluate reviews
  const canEvaluateReviews = user && (user.role === "HOD" || user.role === "PROJECT_MENTOR")

  // Render loading skeleton
  if (isLoading) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">View and manage performance reviews</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">
          {user?.role === "HOD"
            ? `Reviews for all teams in ${user.department} department`
            : user?.role === "CLASS_ADVISOR"
              ? `Reviews for teams in ${user.department} department, Section ${user.section}`
              : user?.role === "PROJECT_MENTOR"
                ? "Reviews for teams you are mentoring"
                : "View and manage performance reviews"}
        </p>
      </div>

      {/* Active Schedules Section */}
      {activeSchedules.length > 0 && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span>Active Review Schedules</span>
            </CardTitle>
            <CardDescription>These reviews are currently in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSchedules.map((schedule) => (
                <div key={schedule.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
                  <div>
                    <h3 className="font-medium">{schedule.stage}</h3>
                    <p className="text-sm text-muted-foreground">
                      {schedule.department} • {new Date(schedule.start).toLocaleDateString()} to{" "}
                      {new Date(schedule.end).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews by Stage */}
      {Object.keys(reviewsByStage).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No reviews found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {user?.role === "PROJECT_MENTOR"
                ? "There are no reviews scheduled for teams you are mentoring."
                : user?.role === "CLASS_ADVISOR"
                  ? `There are no reviews scheduled for teams in ${user.department} department, Section ${user.section}.`
                  : "There are no reviews scheduled yet. Use the 'Schedule Review' button on the dashboard to create reviews."}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(reviewsByStage).map(([stage, stageReviews]) => (
          <Card key={stage} className="mb-6">
            <CardHeader>
              <CardTitle>{stage}</CardTitle>
              <CardDescription>
                {stageReviews.filter((r) => r.is_completed).length} of {stageReviews.length} reviews completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Team</TableHead>
                    <TableHead className="w-[15%]">Department</TableHead>
                    {user?.role === "HOD" && <TableHead className="w-[10%]">Section</TableHead>}
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[20%]">Result</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stageReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.team_topic || review.team_name || `Team ID: ${review.team_id.substring(0, 8)}...`}
                      </TableCell>
                      <TableCell>{review.department}</TableCell>
                      {user?.role === "HOD" && <TableCell>{review.team_section || "N/A"}</TableCell>}
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
                        {review.result ? (
                          review.result
                        ) : (
                          <span className="text-muted-foreground italic">Not evaluated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEvaluateReviews && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleOpenUpdateDialog(review)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {review.is_completed ? "Update" : "Evaluate"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Update Review Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedReview?.is_completed ? "Update Review" : "Evaluate Review"}</DialogTitle>
            <DialogDescription>
              {selectedReview?.is_completed
                ? "Update the evaluation result for this review."
                : "Provide an evaluation result for this review."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <div className="p-2 bg-muted rounded-md">
                {selectedReview?.team_topic ||
                  selectedReview?.team_name ||
                  `Team ID: ${selectedReview?.team_id.substring(0, 8)}...`}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <div className="p-2 bg-muted rounded-md">{selectedReview?.stage}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger id="result">
                  <SelectValue placeholder="Select a result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                  <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedReview?.attachments && selectedReview.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                  {selectedReview.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <span className="text-sm font-medium truncate flex-1">
                        {attachment.attachment_name || "Unnamed attachment"}
                      </span>
                      {attachment.link && (
                        <a
                          href={attachment.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline ml-2"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateReview} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : selectedReview?.is_completed ? "Update" : "Complete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
