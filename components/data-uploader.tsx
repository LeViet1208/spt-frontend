"use client"

import type React from "react"

import { useState } from "react"
import { Upload, File, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Papa from "papaparse"

interface DataUploaderProps {
  onDataUploaded: (data: any[], columns: string[], fileName: string) => void
}

export function DataUploader({ onDataUploaded }: DataUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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
        setError("")
      } else {
        setError("Invalid file type. Please upload a CSV file.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile)
        setError("")
      } else {
        setError("Invalid file type. Please upload a CSV file.")
      }
    }
  }

  const isValidFileType = (file: File) => {
    return file.type === "text/csv" || file.name.endsWith(".csv")
  }

  const removeFile = () => {
    setFile(null)
    setError("")
  }

  const processFile = () => {
    if (!file) return

    setIsProcessing(true)
    setError("")

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false)
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`)
          return
        }

        // Get column headers
        const headers = results.meta.fields || []

        // Pass data to parent component
        onDataUploaded(results.data, headers, file.name)
      },
      error: (error) => {
        setIsProcessing(false)
        setError(`Error parsing CSV: ${error.message}`)
      },
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
            <h3 className="font-medium">Drag and drop your CSV file here</h3>
            <p className="text-sm text-muted-foreground">Upload a CSV file to analyze its data</p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                Browse Files
              </Button>
              <input id="file-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
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
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={processFile} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Analyze Data"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
