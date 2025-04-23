import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from 'lucide-react' // Using Lucide React icons

function Settings() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // State to toggle password visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }
    // Check if password meets the requirements
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/
    if (!passwordRegex.test(password)) {
      alert("Password must be at least 8 characters long and contain at least one number, one lowercase and one uppercase letter")
      return
    }
    // Assuming there's a function to handle the form submission
    // This is a placeholder for the actual submission logic
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to change password")
      }

      console.log("Password changed successfully")
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred")
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-gray-500 mt-2">Update your account preferences</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-medium">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base pr-10"
                />
                {showPassword ? (
                  <EyeOff className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <Eye className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                )}
              </div>
              <p className="text-sm text-gray-500">Password must be at least 8 characters long and contain at least one number, one lowercase and one uppercase letter</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 text-base pr-10"
                />
                {showPassword ? (
                  <EyeOff className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <Eye className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button type="submit" className="w-full py-6 text-lg font-medium">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings