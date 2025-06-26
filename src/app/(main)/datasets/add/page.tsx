"use client"

import type React from "react"

import { BarChart3, ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useDataset, type CreateDatasetProgress } from "@/hooks/useDataset"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Define file requirements
const fileRequirements = [
  {
    id: "transaction",
    name: "Transaction",
    description: "Contains all sales transactions with product and store information",
    requiredColumns: [
      "product_id",
      "price",
      "time_of_transaction",
      "week",
      "household_id",
      "store_id",
      "basket_id",
      "day",
      "coupon"
    ],
    acceptedFormats: ["CSV", "Excel (.xlsx, .xls)"],
    example:
      "transaction_id,date,store_id,product_id,quantity,unit_price,total_price,discount,customer_id\n1001,2023-01-15,S001,P123,2,10.99,21.98,0,C5001",
  },
  {
    id: "product_lookup",
    name: "Product Lookup",
    description: "Contains product details and categorization",
    requiredColumns: [
      "product_id",
      "product_name",
      "category",
      "brand",
      "size",
    ],
    acceptedFormats: ["CSV", "Excel (.xlsx, .xls)"],
    example:
      "product_id,product_name,brand,category,subcategory,price,cost,size,unit\nP123,Premium Coffee,BrandA,Beverages,Coffee,10.99,7.50,250,g",
  },
  {
    id: "causal_lookup",
    name: "Causal Lookup",
    description: "Contains promotion and campaign information",
    requiredColumns: [
      "product_id",
      "store_id",
      "week",
      "feature_desc",
      "display_desc",
      "geography",
    ],
    acceptedFormats: ["CSV", "Excel (.xlsx, .xls)"],
    example:
      "causal_id,campaign_name,start_date,end_date,promotion_type,discount_type,discount_value,affected_products\nC001,Summer Sale,2023-06-01,2023-06-30,Seasonal,Percentage,15,P123;P124;P125",
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
  const [showExample, setShowExample] = useState(false)
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
    if (currentStep < 3) {
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
      setUploadProgress({ step: "creating_master", message: "Starting upload...", progress: 0 })

      ///Create master dataset
      const access_token = localStorage.getItem("access_token")
      const u_id = localStorage.getItem("user_id")

      console.log("Create master dataset....")
      setUploadProgress({ step: "creating_master", message: "Creating dataset...", progress: 10 })
      
      const authResponse = await fetch("http://localhost:8000/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${access_token}`
        },
        body: JSON.stringify({
          user_id: u_id
        }),
      })

      console.log("Response", authResponse)

      if (!authResponse.ok) {
        console.log("Error")
        throw new Error(`Create master dataset failed: ${authResponse.status}`)
      }

      const data = await authResponse.json()
      const d_id = data.dataset_id

      if (authResponse.ok) {
        console.log("Create master dataset successful", data)
      }

      setUploadProgress({ step: "uploading_transaction", message: "Uploading transaction data...", progress: 25 })

      const transactionData = new FormData()
      transactionData.append("transactions", files.transaction!)
      transactionData.append("user_id", u_id!)

      const fileResponse1 = await fetch(`http://localhost:8000/datasets/${d_id}/transactions`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${access_token}`
        },
        body: transactionData
      })

      if (!fileResponse1.ok) {
        throw new Error(`Upload transaction file failed: ${fileResponse1.status}`)
      }

      if (fileResponse1.ok) {
        console.log("Upload transaction successful")
      }

      setUploadProgress({ step: "uploading_product_lookup", message: "Uploading product lookup data...", progress: 50 })

      const productData = new FormData()
      productData.append("product_lookup", files.product_lookup!)
      productData.append("user_id", u_id!)

      const fileResponse2 = await fetch(`http://localhost:8000/datasets/${d_id}/productlookups`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${access_token}`
        },
        body: productData
      })

      if (!fileResponse2.ok) {
        throw new Error(`Upload product file failed: ${fileResponse2.status}`)
      }

      if (fileResponse2.ok) {
        console.log("Upload product successful")
      }

      setUploadProgress({ step: "uploading_causal_lookup", message: "Uploading causal lookup data...", progress: 75 })

      const causalData = new FormData()
      causalData.append("causal_lookup", files.causal_lookup!)
      causalData.append("user_id", u_id!)

      const fileResponse3 = await fetch(`http://localhost:8000/datasets/${d_id}/causallookups`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${access_token}`
        },
        body: causalData
      })

      if (!fileResponse3.ok) {
        throw new Error(`Upload causal file failed: ${fileResponse3.status}`)
      }

      if (fileResponse3.ok) {
        console.log("Upload causal successful")
        setUploadProgress({ step: "completed", message: "Dataset created successfully!", progress: 100 })
        
        // Navigate back to datasets after successful upload
        setTimeout(() => {
          router.push("/datasets")
        }, 1500) // Give user time to see success message
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
      <div className="flex items-center justify-between mb-8 px-2">
        {fileRequirements.map((file, index) => (
          <div key={file.id} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index < currentStep
                  ? "bg-green-100 text-green-600"
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
              currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <span>4</span>
          </div>
          <span className={`text-xs mt-2 ${currentStep === 3 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            Finalize
          </span>
        </div>
      </div>
    )
  }

  const renderUploadProgress = () => {
    if (!uploadProgress) return null

    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm font-medium text-blue-900">{uploadProgress.message}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-blue-700 mt-1">{uploadProgress.progress}% complete</div>
        </CardContent>
      </Card>
    )
  }

  const renderFileUpload = () => {
    const currentFile = fileRequirements[currentStep]

    return (
      <div className="space-y-6">
        <div>
          <CardTitle className="text-xl mb-2">{currentFile.name}</CardTitle>
          <CardDescription>{currentFile.description}</CardDescription>
        </div>

        {/* Hidden file input - always present */}
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
        />

        {/* Required Columns */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Required Columns:</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {currentFile.requiredColumns.map((column) => (
                <Badge key={column} variant="secondary" className="bg-blue-100 text-blue-800">
                  {column}
                </Badge>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExample(!showExample)}
              className="text-blue-600 hover:text-blue-800 p-0 h-auto"
            >
              {showExample ? "Hide" : "Show"} example
              <ChevronRight className={`ml-1 h-3 w-3 transition-transform ${showExample ? "rotate-90" : ""}`} />
            </Button>

            {showExample && (
              <Card className="mt-3">
                <CardContent className="p-3">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">{currentFile.example}</pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className={`border-2 border-dashed ${
          files[currentFile.id] ? "border-green-300 bg-green-50" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}>
          <CardContent className="p-8 text-center">
            {files[currentFile.id] ? (
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-green-300">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">{files[currentFile.id]?.name}</p>
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
                    Edit
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
                <CardTitle className="text-lg mb-2">Upload {currentFile.name}</CardTitle>
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
        <div>
          <CardTitle className="text-xl mb-6">Finalize Dataset</CardTitle>
        </div>

        {/* Upload Progress */}
        {renderUploadProgress()}

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
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              rows={3}
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 resize-none"
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
                    <span className="text-sm">{file.name}</span>
                  </div>
                  {files[file.id] ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
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
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              size="icon"
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Add New Dataset</CardTitle>
              <CardDescription>Upload your retail data files to create a new dataset</CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent className="p-8">
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          <div className="mb-8">
            {currentStep < 3 ? renderFileUpload() : renderFinalStep()}
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
                isSubmitting || (currentStep < 3 ? !files[fileRequirements[currentStep].id] : !datasetName.trim())
              }
              className="flex items-center gap-2"
            >
              {isSubmitting && <Upload className="h-4 w-4 animate-pulse" />}
              {isSubmitting ? "Creating..." : currentStep === 3 ? "Create Dataset" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
