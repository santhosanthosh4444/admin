"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { toast } from "react-hot-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface DiaryGeneratorProps {
  teamId: string
  teamName?: string
}

// Define types for API response
interface Student {
  student_id: string
  name: string
  register_number: string
  department?: string
  section?: string
}

interface Log {
  student_id: string
  date: string
  completed_task?: string
  comments?: string
  students?: Student
}

interface Review {
  id: number
  stage: string
  created_at: string
  completed_on: string | null
  result: string | null
  marks: number
}

interface ApiResponse {
  team: {
    department?: string
    section?: string
    topic?: string
  }
  project?: {
    title?: string
  }
  students: Student[]
  teamLead?: Student
  mentor?: {
    name: string
  }
  logs: Log[]
  reviews: Review[]
}

// Extend jsPDF type to include lastAutoTable property
interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number
  }
}

export function DiaryGenerator({ teamId, teamName }: DiaryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateDiary = async () => {
    if (!teamId) {
      toast.error("Team ID is required")
      return
    }

    setIsGenerating(true)

    try {
      // Fetch diary data from API
      const response = await fetch("/api/diary/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to generate diary")
      }

      const apiData = (await response.json()) as ApiResponse

      console.log("API Response:", apiData)

      // Transform API data to the format expected by the PDF generator
      const data = {
        team: apiData.team,
        project: apiData.project,
        teamMembers: apiData.students.map((student) => ({
          studentId: student.student_id,
          name: student.name,
          regNo: student.register_number,
        })),
        mentor: apiData.mentor,
        logs: apiData.logs,
        // Group logs by student ID
        logsByStudent: apiData.logs.reduce(
          (acc, log) => {
            if (!acc[log.student_id]) {
              acc[log.student_id] = []
            }
            acc[log.student_id].push(log)
            return acc
          },
          {} as Record<string, Log[]>,
        ),
        // Format reviews for the PDF
        reviews: apiData.reviews.map((review, index) => ({
          reviewNo: index + 1,
          date: review.completed_on
            ? new Date(review.completed_on).toLocaleDateString()
            : new Date(review.created_at).toLocaleDateString(),
          feedback: review.result || "",
          reviewer: "Reviewer", // This information isn't in the API response
          planOfAction: "",
          targetDate: "",
          marks: review.marks || 0,
        })),
      }

      // Create PDF
      const pdf = new jsPDF() as ExtendedJsPDF
      const headerImageUrl = "https://ik.imagekit.io/rdunkpgr8/image.png"

      // Function to add header to each page
      const addHeader = () => {
        // Add header image
        try {
          pdf.addImage(headerImageUrl, "PNG", 10, 10, 190, 25)
        } catch (error) {
          console.error("Error adding header image:", error)
          // If image fails to load, add text header instead
          pdf.setFontSize(16)
          pdf.text("KGiSL Institute of Technology", 105, 15, { align: "center" })
          pdf.setFontSize(10)
          pdf.text("(An Autonomous Institution)", 105, 22, { align: "center" })
          pdf.text("Affiliated to Anna University, Approved by AICTE, Recognized by UGC", 105, 27, { align: "center" })
          pdf.text("Accredited by NAAC & NBA (B.E-CSE,B.E-ECE, B.Tech-IT)", 105, 32, { align: "center" })
          pdf.text("365, KGiSL Campus, Thudiyalur Road, Saravanampatti, Coimbatore – 641035", 105, 37, {
            align: "center",
          })
        }

        // Add document reference
        pdf.setFontSize(10)
        pdf.text("PROJECT WORK", 20, 45)
        pdf.text("Doc Ref: KITE/IQAC/PW/06", 170, 45)

        // Add title
        pdf.setFontSize(14)
        pdf.text("PROJECT DIARY", 105, 55, { align: "center" })
      }

      // Add first page
      addHeader()

      // Department and Year/Sem/Sec
      pdf.setFontSize(10)
      pdf.text(`Department: ${data.team?.department || ""}`, 20, 65)
      pdf.text(`Year/Sem/Sec: ${data.team?.section || ""}`, 120, 65)

      // Course Code & Title
      pdf.text(`Course Code & Title: ${""}`, 20, 75) // Course code not in API response

      // Project Title
      pdf.text(`Project Title: ${data.project?.title || data.team?.topic || ""}`, 20, 85)

      // I. Team Members
      pdf.setFontSize(12)
      pdf.text("I. Team Members", 20, 100)

      const teamMembersData = [
        ["S.NO.", "REG.NO.", "STUDENT NAME", "INTERNAL SUPERVISOR", "EXTERNAL SUPERVISOR (If Applicable)"],
      ]

      data.teamMembers.forEach((member, index) => {
        teamMembersData.push([
          (index + 1).toString(),
          member.regNo,
          member.name,
          index === 0 ? data.mentor?.name || "" : "", // Only show mentor name for first student
          "",
        ])
      })

      autoTable(pdf, {
        startY: 105,
        head: [teamMembersData[0]],
        body: teamMembersData.slice(1),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      })

      // II. Action Plan
      pdf.addPage()
      addHeader()
      pdf.setFontSize(12)
      pdf.text("II. Action Plan", 20, 70)

      const actionPlanData = [
        [
          "S.NO.",
          "MAJOR ACTIVITIES",
          "TARGET DATE",
          "ACTUAL DATE",
          "REASON FOR DELAY (If Any)",
          "REMARKS",
          "SIGNATURE OF THE SUPERVISOR",
        ],
      ]

      // Add empty rows for action plan
      for (let i = 0; i < 8; i++) {
        actionPlanData.push(["", "", "", "", "", "", ""])
      }

      autoTable(pdf, {
        startY: 75,
        head: [actionPlanData[0]],
        body: actionPlanData.slice(1),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      })

      // III. Attendance by Supervisor
      pdf.addPage()
      addHeader()
      pdf.setFontSize(12)
      pdf.text("III. Attendance by Supervisor", 20, 70)

      // Create attendance table with dates from logs
      // Ensure dates are properly typed and sorted
      const allDates = [...new Set(data.logs.map((log) => log.date))].sort()

      // Format dates for display
      const formattedDates = allDates.map((dateStr) => {
        // Ensure dateStr is a string
        const dateString = String(dateStr)
        try {
          return new Date(dateString).toLocaleDateString()
        } catch (e) {
          console.error("Invalid date:", dateString)
          return dateString
        }
      })

      const attendanceHeaders = ["STUDENT NAME", ...formattedDates]
      const attendanceData = [attendanceHeaders]

      // Add attendance data for each student
      data.teamMembers.forEach((member) => {
        const studentLogs = data.logsByStudent[member.studentId] || []
        const studentLogDates = studentLogs.map((log) => log.date)

        const row = [member.name]
        allDates.forEach((date) => {
          // Mark attendance if student has a log for this date
          // Use string comparison to avoid type issues
          row.push(studentLogDates.includes(date) ? "P" : "")
        })
        attendanceData.push(row)
      })

      // Add signature row
      attendanceData.push(["SIGNATURE OF THE SUPERVISOR", ...Array(allDates.length).fill("")])

      autoTable(pdf, {
        startY: 75,
        head: [attendanceData[0]],
        body: attendanceData.slice(1),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      })

      // IV. Attendance by External Supervisor (If Applicable)
      pdf.addPage()
      addHeader()
      pdf.setFontSize(12)
      pdf.text("IV. Attendance by External Supervisor (If Applicable)", 20, 70)

      // Create empty external attendance table
      const externalAttendanceData = [attendanceHeaders]

      // Add empty rows for external attendance
      data.teamMembers.forEach((member) => {
        externalAttendanceData.push([member.name, ...Array(allDates.length).fill("")])
      })

      // Add signature row
      externalAttendanceData.push(["SIGNATURE OF THE EXTERNAL SUPERVISOR", ...Array(allDates.length).fill("")])

      autoTable(pdf, {
        startY: 75,
        head: [externalAttendanceData[0]],
        body: externalAttendanceData.slice(1),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      })

      // V. Progress of the work
      pdf.addPage()
      addHeader()
      pdf.setFontSize(12)
      pdf.text("V. Progress of the work", 20, 70)

      const progressData = [["DATE", "DETAILS OF WORK DONE", "SIGNATURE OF SUPERVISOR", "REMARKS"]]

      // Add log entries as progress
      data.logs.forEach((log) => {
        // Find student name - either from the log.students property or from teamMembers
        let studentName = "Unknown"
        if (log.students && log.students.name) {
          studentName = log.students.name
        } else {
          const student = data.teamMembers.find((s) => s.studentId === log.student_id)
          if (student) {
            studentName = student.name
          }
        }

        // Format date safely
        let formattedDate = ""
        try {
          formattedDate = new Date(String(log.date)).toLocaleDateString()
        } catch (e) {
          console.error("Invalid date:", log.date)
          formattedDate = String(log.date)
        }

        progressData.push([formattedDate, `${studentName}: ${log.completed_task || ""}`, "", log.comments || ""])
      })

      // Add empty rows if needed
      if (progressData.length < 10) {
        for (let i = 0; i < 10 - progressData.length; i++) {
          progressData.push(["", "", "", ""])
        }
      }

      autoTable(pdf, {
        startY: 75,
        head: [progressData[0]],
        body: progressData.slice(1),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      })

      // VI. Feedback from Project Review
      pdf.addPage()
      addHeader()
      pdf.setFontSize(12)
      pdf.text("VI. Feedback from Project Review", 20, 70)

      const feedbackData = [
        [
          "REVIEW NO.",
          "REVIEW DATE",
          "DETAILS OF FEEDBACK RECEIVED",
          "NAME OF THE REVIEWER",
          "PLAN OF ACTION",
          "TARGET DATE",
          "SIGNATURE OF THE SUPERVISOR",
        ],
      ]

      // Add review feedback
      data.reviews.forEach((review) => {
        feedbackData.push([review.reviewNo.toString(), review.date, review.feedback, review.reviewer, "", "", ""])
      })

      // Add empty rows if needed
      if (feedbackData.length < 10) {
        for (let i = 0; i < 10 - feedbackData.length; i++) {
          feedbackData.push(["", "", "", "", "", "", ""])
        }
      }

      autoTable(pdf, {
        startY: 75,
        head: [feedbackData[0]],
        body: feedbackData.slice(1),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      })

      // VII. Review & Internal Mark
      pdf.addPage()
      addHeader()
      pdf.setFontSize(12)
      pdf.text("VII. Review & Internal Mark", 20, 70)

      const marksData = [["REG.NO.", "NAME OF THE STUDENT", "REVIEW MARKS (100)", "", "", "INTERNAL MARK (100)"]]
      marksData[0].splice(2, 0, "I", "II", "III")

      // Add student marks
      data.teamMembers.forEach((member) => {
        const row = [member.regNo, member.name]

        // Add review marks (up to 3 reviews)
        const studentReviews = data.reviews.filter((r) => r.reviewNo <= 3)
        for (let i = 0; i < 3; i++) {
          row.push(studentReviews[i] ? studentReviews[i].marks.toString() : "")
        }

        // Add internal mark (average of review marks)
        const validMarks = studentReviews.filter((r) => r.marks > 0).map((r) => r.marks)
        const avgMark =
          validMarks.length > 0 ? Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length) : ""
        row.push(avgMark.toString())

        marksData.push(row)
      })

      autoTable(pdf, {
        startY: 75,
        head: [marksData[0]],
        body: marksData.slice(1),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      })

      // Add signature section
      pdf.setFontSize(10)

      // Get the final Y position from the last table
      const finalY = pdf.lastAutoTable?.finalY || 200

      pdf.text("Prepared By", 30, finalY + 20)
      pdf.text("Verified By", 105, finalY + 20)
      pdf.text("Approved By", 170, finalY + 20)

      pdf.text("Project Supervisor", 30, finalY + 40)
      pdf.text("Project Coordinator", 105, finalY + 40)
      pdf.text("HoD", 170, finalY + 40)

      // Save the PDF
      const teamNameForFilename = (teamName || data.team?.topic || "project-diary")
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
      pdf.save(`${teamNameForFilename}-diary.pdf`)

      toast.success("Project diary generated successfully")
    } catch (error) {
      console.error("Error generating diary:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate project diary")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generateDiary} disabled={isGenerating} className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      {isGenerating ? "Generating..." : "Generate Diary"}
    </Button>
  )
}
