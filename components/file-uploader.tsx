"use client"

import type React from "react"
import { useState } from "react"
import { Upload, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile } from "@/lib/user-service"
import { saveSalesData, saveInventoryData, saveCustomerData } from "@/lib/retail-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploaderProps {
  dataType: string
}

export function FileUploader({ dataType }: FileUploaderProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile)
        setMessage("")
        setError("")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile)
        setMessage("")
        setError("")
      }
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    return validTypes.includes(file.type)
  }

  const removeFile = () => {
    setFile(null)
    setMessage("")
    setError("")
  }

  const processFile = async () => {
    if (!file || !user || !user.email) return

    setIsProcessing(true)
    setMessage("")
    setError("")

    try {
      // Get user profile to get user ID
      const userProfile = await getUserProfile(user.email)
      if (!userProfile || !userProfile.id) {
        throw new Error("User profile not found")
      }

      const userId = userProfile.id

      // Read file content
      const fileContent = await readFileContent(file)

      // Process data based on type
      let result

      if (dataType === "sales") {
        const salesData = parseCSVData(fileContent)
        result = await saveSalesData(userId, salesData)
      } else if (dataType === "inventory") {
        const inventoryData = parseCSVData(fileContent)
        result = await saveInventoryData(userId, inventoryData)
      } else if (dataType === "customers") {
        const customerData = parseCSVData(fileContent)
        result = await saveCustomerData(userId, customerData)
      }

      if (result && result.success) {
        setMessage(`Data imported successfully. Import ID: ${result.importId}`)
        setFile(null)
      } else {
        throw new Error("Failed to import data")
      }
    } catch (error: any) {
      console.error("Error processing file:", error)
      setError(error.message || "An error occurred while processing the file")
    } finally {
      setIsProcessing(false)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          resolve(e.target.result)
        } else {
          reject(new Error("Failed to read file"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  const parseCSVData = (csvContent: string) => {
    // Simple CSV parser - in a real app, use a robust CSV parsing library
    const lines = csvContent.split("\n")
    const headers = lines[0].split(",").map((header) => header.trim())

    const data = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",").map((value) => value.trim())
      const row: Record<string, any> = {}

      headers.forEach((header, index) => {
        row[header] = values[index]
      })

      data.push(row)
    }

    return data
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-medium">Drag and drop your file here</h3>
            <p className="text-sm text-muted-foreground">Supported formats: CSV, XLS, XLSX</p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                Browse Files
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <File className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={processFile} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Process Data"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
