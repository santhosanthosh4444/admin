"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { File, Download, Loader2, Plus } from "lucide-react"
import { toast } from "react-hot-toast"

interface Template {
  id: number
  name: string
  link: string
  review: string
  created_at: string
}

interface TemplatesListProps {
  reviewStage: string
  canUpload: boolean
  onUploadClick: () => void
}

export function TemplatesList({ reviewStage, canUpload, onUploadClick }: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [reviewStage])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reviews/templates?review=${encodeURIComponent(reviewStage)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error(`Error fetching templates for ${reviewStage}:`, error)
      toast.error(`Failed to load templates for ${reviewStage}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <File className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-1">No templates available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {canUpload
            ? "Upload templates for students to use during this review stage."
            : "No templates have been uploaded for this review stage yet."}
        </p>
        {canUpload && (
          <Button variant="outline" onClick={onUploadClick} className="mx-auto">
            <Plus className="h-4 w-4 mr-2" />
            Upload Template
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <div key={template.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                Added on {new Date(template.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <a
            href={template.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      ))}
    </div>
  )
}
