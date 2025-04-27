"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile } from "@/lib/user-service"
import { getImportHistory } from "@/lib/retail-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function ImportHistory() {
  const { user } = useAuth()
  const [imports, setImports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchImportHistory = async () => {
      if (!user || !user.email) return

      try {
        // Get user profile to get user ID
        const userProfile = await getUserProfile(user.email)
        if (!userProfile || !userProfile.id) {
          throw new Error("User profile not found")
        }

        const userId = userProfile.id

        // Get import history
        const history = await getImportHistory(userId)
        setImports(history || [])
      } catch (error: any) {
        console.error("Error fetching import history:", error)
        setError(error.message || "Failed to fetch import history")
      } finally {
        setLoading(false)
      }
    }

    fetchImportHistory()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  if (imports.length === 0) {
    return <div className="text-center text-muted-foreground">No import history found</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Import ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Records</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {imports.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">IMP-{item.id.toString().padStart(3, "0")}</TableCell>
            <TableCell className="capitalize">{item.import_type}</TableCell>
            <TableCell>{item.record_count}</TableCell>
            <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={item.status === "Completed" ? "default" : "destructive"}>
                {item.status || "Completed"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
