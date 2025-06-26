"use client"

import type React from "react"

import { BarChart3, ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useDataset } from "@/hooks/useDataset"
import type { CreateDatasetProgress, FileRequirement, ColumnRequirement } from "@/utils/types/dataset"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Define file requirements
const fileRequirements: FileRequirement[] = [
  {
    id: "transaction",
    name: "Transactions",
    description: "Contains all sales transactions with product and store information",
    requiredColumns: [
      { name: "product_id", description: "Unique identifier for each product", example: "P123" },
      { name: "price", description: "Selling price of the product", example: "10.99" },
      { name: "time_of_transaction", description: "Timestamp of the transaction", example: "2023-01-15 14:30:00" },
      { name: "week", description: "Week number of the transaction", example: "1" },
      { name: "household_id", description: "Unique identifier for the household/customer", example: "H001" },
      { name: "store_id", description: "Unique identifier for the store", example: "S001" },
      { name: "basket_id", description: "Unique identifier for the shopping basket", example: "B1001" },
      { name: "day", description: "Day of the week (e.g., Monday, Tuesday)", example: "Monday" },
      { name: "coupon", description: "Indicates if a coupon was used (0 or 1)", example: "1" }
    ],
    acceptedFormats: ["CSV", "Excel (.xlsx, .xls)"],
  },
  {
    id: "product_lookup",
    name: "Products",
    description: "Contains product details and categorization",
    requiredColumns: [
      { name: "product_id", description: "Unique identifier for each product", example: "P123" },
      { name: "product_name", description: "Name of the product", example: "Premium Coffee" },
      { name: "category", description: "Product category (e.g., Beverages, Snacks)", example: "Beverages" },
      { name: "brand", description: "Brand of the product", example: "BrandA" },
      { name: "size", description: "Size or quantity of the product", example: "250g" }
    ],
    acceptedFormats: ["CSV", "Excel (.xlsx, .xls)"],
  },
  {
    id: "causal_lookup",
    name: "Causal Data",
    description: "Contains promotion and campaign information",
    requiredColumns: [
      { name: "product_id", description: "Unique identifier for each product", example: "P123" },
      { name: "store_id", description: "Unique identifier for the store", example: "S001" },
      { name: "week", description: "Week number when the promotion was active", example: "2" },
      { name: "feature_desc", description: "Description of the feature (e.g., 'Display Ad', 'In-store Promo')", example: "Display Ad" },
      { name: "display_desc", description: "Description of the display (e.g., 'End Cap', 'Shelf')", example: "End Cap" },
      { name: "geography", description: "Geographical area of the promotion", example: "National" }
    ],
    acceptedFormats: ["CSV", "Excel (.xlsx, .xls)"],
  },
]

export default function AddDatasetPage() {
  const router = useRouter()
  const { createDataset } = useDataset()
  const [currentStep, setCurrentStep] = useState(0)
  const [datasetName, setDatasetName] = useState("")
  const [datasetDescription, setDatasetDescription] = useState("")
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    transaction: null,
    product_lookup: null,
    causal_lookup: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<CreateDatasetProgress | null>(null)

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      router.push("/datasets")
    } else {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep, router]);

  const handleNext = () => {
    if (currentStep < fileRequirements.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit all files
      handleSubmit()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileId = fileRequirements[currentStep].id
      setFiles({
        ...files,
        [fileId]: e.target.files[0],
      })
    }
  }

  const handleSubmit = async () => {
    if (!datasetName.trim()) {
      setSubmitError("Dataset name is required")
      return
    }

    if (!files.transaction || !files.product_lookup || !files.causal_lookup) {
      setSubmitError("All three files are required")
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      const createdDataset = await createDataset(
        {
          name: datasetName,
          description: datasetDescription,
          files: {
            transaction: files.transaction!,
            product_lookup: files.product_lookup!,
            causal_lookup: files.causal_lookup!,
          },
        },
        (progress) => {
          setUploadProgress(progress)
        }
      )

      if (createdDataset) {
        // Navigate back to datasets after successful upload
        setTimeout(() => {
          router.push("/datasets")
        }, 1500) // Give user time to see success message
      } else {
        // Error handled by useDataset hook, just set local error state if needed
        setSubmitError("Failed to create dataset. Please check console for details.")
      }

    } catch (error) {
      console.error("Error creating dataset:", error)
      setSubmitError("An unexpected error occurred")
      setUploadProgress(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        {fileRequirements.map((file, index) => (
          <div key={file.id} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index < currentStep
                  ? "bg-accent text-accent-foreground" // Using accent for completed steps
                  : index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? <CheckCircle className="h-5 w-5" /> : <span>{index + 1}</span>}
            </div>
            <span className={`text-xs mt-2 ${index === currentStep ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {file.name}
            </span>
          </div>
        ))}

        {/* Final step */}
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep === fileRequirements.length ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <span>{fileRequirements.length + 1}</span>
          </div>
          <span className={`text-xs mt-2 ${currentStep === fileRequirements.length ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            Final
          </span>
        </div>
      </div>
    )
  }

  const renderFileUpload = () => {
    const currentFile = fileRequirements[currentStep]

    return (
      <div className="space-y-6">
        {/* Hidden file input - always present */}
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
        />

        {/* Required Columns */}
        <Card className="border-border bg-background">
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Required Columns:</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <TooltipProvider>
                {currentFile.requiredColumns.map((column) => (
                  <Tooltip key={column.name}>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="cursor-help">
                        {column.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium">{column.description}</p>
                      <p className="text-xs mt-1">Example: {column.example}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className={`border-2 border-dashed ${
          files[currentFile.id] ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"
        }`}>
          <CardContent className="text-center">
            {files[currentFile.id] ? (
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-primary">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{files[currentFile.id]?.name}</p>
                    <p className="text-sm text-muted-foreground">File selected successfully</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('file-upload') as HTMLInputElement;
                      if (input) {
                        input.value = ''; // Clear the input to allow selecting the same file again
                        input.click();
                      }
                    }}
                  >
                    Choose another
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFiles({ ...files, [currentFile.id]: null })}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="text-lg mb-2 text-foreground">Upload {currentFile.name}</CardTitle>
                <CardDescription className="mb-4">Drag and drop your file here, or click to browse</CardDescription>
                <Button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="hover:scale-105 transform duration-200"
                >
                  Choose File
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Supported Formats */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Accepted formats: {currentFile.acceptedFormats.join(", ")}</span>
        </div>
      </div>
    )
  }

  const renderFinalStep = () => {
    return (
      <div className="space-y-6">

        {/* Error Message */}
        {submitError && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{submitError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dataset Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dataset Name*</label>
            <Input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter dataset name"
              required
            />
          </div>

          <div>
            <label htmlFor="dataset-description" className="block text-sm font-medium mb-2">Description (Optional)</label>
            <Textarea
              id="dataset-description"
              rows={3}
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Describe your dataset"
            />
          </div>
        </div>

        {/* Files Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files Ready for Upload:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fileRequirements.map((file) => (
                <div key={file.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{file.name}</span>
                  </div>
                  {files[file.id] ? (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1 text-primary" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <Card>
        <CardContent>
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          <div className="mb-8">
            {currentStep < fileRequirements.length ? renderFileUpload() : renderFinalStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              {currentStep === 0 ? "Cancel" : "Back"}
            </Button>

            <Button
              onClick={handleNext}
              disabled={
                isSubmitting || (currentStep < fileRequirements.length ? !files[fileRequirements[currentStep].id] : !datasetName.trim())
              }
              className="flex items-center gap-2"
            >
              {isSubmitting && <Upload className="h-4 w-4 text-primary animate-pulse" />}
              {isSubmitting ? "Creating..." : currentStep === fileRequirements.length ? "Create Dataset" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
