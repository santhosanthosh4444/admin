"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { uploadToImageKit } from "@/lib/imagekit"

interface TemplateUploadProps {
  isOpen: boolean
  onClose: () => void
  reviewStage: string
  onSuccess: () => void
}

export function TemplateUpload({ isOpen, onClose, reviewStage, onSuccess }: TemplateUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Set a default file name based on the original file name (without extension)
      const originalName = selectedFile.name.split(".")[0]
      setFileName(originalName)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)

      // Set a default file name based on the original file name (without extension)
      const originalName = droppedFile.name.split(".")[0]
      setFileName(originalName)
    }
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    if (!fileName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    setIsUploading(true)

    try {
      // Get file extension
      const fileExtension = file.name.split(".").pop() || ""
      // Create a file name with the extension
      const fullFileName = `${fileName.trim()}_${Date.now()}.${fileExtension}`

      // Upload the file to ImageKit
      const url = await uploadToImageKit(file, `${reviewStage.replace(/\s+/g, "_")}_${fullFileName}`)

      // Save template to database
      const response = await fetch("/api/reviews/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fileName.trim(),
          link: url,
          review: reviewStage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save template")
      }

      toast.success("Template uploaded successfully")

      // Reset form and close dialog
      setFile(null)
      setFileName("")
      onClose()
      onSuccess()
    } catch (error) {
      console.error("Error uploading template:", error)
      toast.error("Failed to upload template")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Template</DialogTitle>
          <DialogDescription>
            Upload a template for {reviewStage}. This will be available for students to download.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            />

            {file ? (
              <div className="flex flex-col items-center">
                <FileText className="h-10 w-10 text-primary mb-2" />
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={handleRemoveFile}>
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-medium">Drag and drop a file here, or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, Word, PowerPoint, Excel, Text
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileName">Template Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter a name for this template"
              disabled={isUploading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpload} disabled={isUploading || !file || !fileName.trim()}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
