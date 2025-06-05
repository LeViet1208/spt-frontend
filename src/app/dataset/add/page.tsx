"use client"

import type React from "react"

import { BarChart3, ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useDatasets, type CreateDatasetProgress } from "@/hooks/use-datasets"

// Define file requirements
const fileRequirements = [
  {
    id: "transaction",
    name: "Transaction Data",
    description: "Contains all sales transactions with product and store information",
    requiredColumns: [
      "transaction_id",
      "date",
      "store_id",
      "product_id",
      "quantity",
      "unit_price",
      "total_price",
      "discount",
      "customer_id",
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
      "brand",
      "category",
      "subcategory",
      "price",
      "cost",
      "size",
      "unit",
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
      "causal_id",
      "campaign_name",
      "start_date",
      "end_date",
      "promotion_type",
      "discount_type",
      "discount_value",
      "affected_products",
    ],
    acceptedFormats: ["CSV", "Excel (.xlsx, .xls)"],
    example:
      "causal_id,campaign_name,start_date,end_date,promotion_type,discount_type,discount_value,affected_products\nC001,Summer Sale,2023-06-01,2023-06-30,Seasonal,Percentage,15,P123;P124;P125",
  },
]

export default function AddDatasetPage() {
  const router = useRouter()
  const { createDataset } = useDatasets()
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

  const handleBack = () => {
    if (currentStep === 0) {
      router.push("/dashboard")
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

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
      setUploadProgress(null)

      const result = await createDataset(
        {
          name: datasetName.trim(),
          description: datasetDescription.trim() || undefined,
          files: {
            transaction: files.transaction,
            product_lookup: files.product_lookup,
            causal_lookup: files.causal_lookup,
          },
        },
        (progress) => {
          setUploadProgress(progress)
        },
      )

      if (result.success) {
        // Navigate back to dashboard after successful upload
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500) // Give user time to see success message
      } else {
        setSubmitError(result.error || "Failed to create dataset")
        setUploadProgress(null)
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
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {index < currentStep ? <CheckCircle className="h-5 w-5" /> : <span>{index + 1}</span>}
            </div>
            <span className={`text-xs mt-2 ${index === currentStep ? "font-medium text-gray-900" : "text-gray-500"}`}>
              {file.name}
            </span>
          </div>
        ))}

        {/* Final step */}
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep === 3 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            <span>4</span>
          </div>
          <span className={`text-xs mt-2 ${currentStep === 3 ? "font-medium text-gray-900" : "text-gray-500"}`}>
            Finalize
          </span>
        </div>
      </div>
    )
  }

  const renderUploadProgress = () => {
    if (!uploadProgress) return null

    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
      </div>
    )
  }

  const renderFileUpload = () => {
    const currentFile = fileRequirements[currentStep]

    return (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{currentFile.name}</h3>
        <p className="text-gray-600 mb-6">{currentFile.description}</p>

        {/* Required Columns */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Required Columns:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentFile.requiredColumns.map((column) => (
              <span key={column} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                {column}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center">
            <button
              onClick={() => setShowExample(!showExample)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showExample ? "Hide" : "Show"} example
              <ChevronRight className={`h-3 w-3 transition-transform ${showExample ? "rotate-90" : ""}`} />
            </button>
          </div>

          {showExample && (
            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 overflow-x-auto">
              <pre className="text-xs text-gray-700">{currentFile.example}</pre>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            files[currentFile.id] ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {files[currentFile.id] ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
              <h4 className="text-lg font-medium text-gray-900 mb-1">File uploaded successfully</h4>
              <p className="text-gray-600 mb-3">{files[currentFile.id]?.name}</p>
              <button
                onClick={() => setFiles({ ...files, [currentFile.id]: null })}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove and upload different file
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload {currentFile.name}</h4>
              <p className="text-gray-600 mb-4">Drag and drop your file here, or click to browse</p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-colors inline-block cursor-pointer"
              >
                Choose File
              </label>
            </>
          )}
        </div>

        {/* Supported Formats */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>Accepted formats: {currentFile.acceptedFormats.join(", ")}</span>
        </div>
      </div>
    )
  }

  const renderFinalStep = () => {
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Finalize Dataset</h3>

        {/* Upload Progress */}
        {renderUploadProgress()}

        {/* Error Message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{submitError}</span>
            </div>
          </div>
        )}

        {/* Dataset Details */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dataset Name*</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100"
              placeholder="Enter dataset name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              rows={3}
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100"
              placeholder="Describe your dataset"
            />
          </div>
        </div>

        {/* Files Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Files Ready for Upload:</h4>
          <div className="space-y-3">
            {fileRequirements.map((file) => (
              <div key={file.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
                {files[file.id] ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">Missing</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SPT Analytics</h1>
              <p className="text-xs text-gray-500">Add New Dataset</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Dataset</h2>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Step Content */}
            <div className="mb-8">{currentStep < 3 ? renderFileUpload() : renderFinalStep()}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {currentStep === 0 ? "Cancel" : "Back"}
              </button>

              <button
                onClick={handleNext}
                disabled={
                  isSubmitting || (currentStep < 3 ? !files[fileRequirements[currentStep].id] : !datasetName.trim())
                }
                className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Upload className="h-4 w-4 animate-pulse" />}
                {isSubmitting ? "Creating..." : currentStep === 3 ? "Create Dataset" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
