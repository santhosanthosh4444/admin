"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadToImageKit } from "@/lib/imagekit"
import { toast } from "react-hot-toast"
import { FileText, Upload, X, Loader2 } from "lucide-react"

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void
  reviewStage: string
}

export function FileUpload({ onUploadComplete, reviewStage }: FileUploadProps) {
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

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    if (!fileName.trim()) {
      toast.error("Please enter a file name")
      return
    }

    setIsUploading(true)

    try {
      // Generate a unique file name with the original extension
      const extension = file.name.split(".").pop()
      const uniqueFileName = `${fileName.trim()}_${Date.now()}.${extension}`

      // Upload the file to ImageKit
      const url = await uploadToImageKit(file, uniqueFileName)

      // Call the callback with the URL and file name
      onUploadComplete(url, fileName.trim())

      // Reset the form
      setFile(null)
      setFileName("")

      toast.success("File uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearFile = () => {
    setFile(null)
    setFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
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
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation()
                handleClearFile()
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="font-medium">Drag and drop a file here, or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1">Supported formats: PDF, Word, PowerPoint, Excel, Text</p>
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

      <Button onClick={handleUpload} disabled={!file || !fileName.trim() || isUploading} className="w-full">
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
    </div>
  )
}
