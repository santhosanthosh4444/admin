"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { StaffCredentials } from "./add-staff-view"

interface CredentialsDialogProps {
  isOpen: boolean
  onClose: () => void
  credentials: StaffCredentials
}

export function CredentialsDialog({ isOpen, onClose, credentials }: CredentialsDialogProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const text = `
Email: ${credentials.email}
Password: ${credentials.password}
Role: ${credentials.role}
${credentials.department ? `Department: ${credentials.department}` : ""}
${credentials.section ? `Section: ${credentials.section}` : ""}
    `.trim()

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Staff Account Created</DialogTitle>
          <DialogDescription>
            The staff account has been created successfully. Please save these credentials securely.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email (Username)</Label>
            <div className="flex items-center gap-2">
              <Input id="email" value={credentials.email} readOnly className="flex-1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Generated Password</Label>
            <div className="flex items-center gap-2">
              <Input id="password" value={credentials.password} readOnly className="flex-1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <div className="flex items-center gap-2">
              <Input id="role" value={credentials.role} readOnly className="flex-1" />
            </div>
          </div>

          {credentials.department && (
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <div className="flex items-center gap-2">
                <Input id="department" value={credentials.department} readOnly className="flex-1" />
              </div>
            </div>
          )}

          {credentials.section && (
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <div className="flex items-center gap-2">
                <Input id="section" value={credentials.section} readOnly className="flex-1" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Credentials
              </>
            )}
          </Button>

          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
