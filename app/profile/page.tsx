"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile, updateUserProfile } from "@/lib/user-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function Profile() {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.email) {
        try {
          const profile = await getUserProfile(user.email)
          if (profile) {
            setName(profile.name || "")
            setEmail(profile.email || "")
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      }
    }

    fetchUserProfile()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      if (user && user.email) {
        await updateUserProfile(user.email, name)
        setMessage("Profile updated successfully")
      }
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <DashboardSidebar currentPage="overview" setCurrentPage={() => {}} />
      <DashboardShell>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight mb-6">User Profile</h2>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {message && (
                <Alert className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                  <p className="text-sm text-muted-foreground">Your email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </div>
  )
}
