"use client"

import {
  ArrowLeft,
  Database,
  Megaphone,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDatasets } from "@/hooks/use-datasets"
import { campaignAPI, type CreateCampaignRequest } from "@/lib/api/campaign"

export default function NewCampaignPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { datasets, loading: datasetsLoading, error: datasetsError, refreshDatasets } = useDatasets()

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: "",
    dataset_id: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Filter datasets to only show analyzed ones
  const availableDatasets = datasets.filter(
    dataset => dataset.analysisStatus === "analyzed"
  )

  const handleBack = () => {
    router.back()
  }

  const handleInputChange = (field: keyof CreateCampaignRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Campaign name is required"
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Campaign name must be at least 3 characters long"
    }

    if (!formData.dataset_id || formData.dataset_id === 0) {
      newErrors.dataset_id = "Please select a dataset"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await campaignAPI.createCampaign(formData)

      if (response.success && response.data) {
        // Navigate to the new campaign detail page
        router.push(`/campaign/${response.data.campaign_id}`)
      } else {
        setSubmitError(response.error || "Failed to create campaign")
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred")
      console.error("Error creating campaign:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
              <p className="text-sm text-gray-500">Set up a new promotion campaign</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Campaign Information</h2>
                <p className="text-sm text-gray-500">Provide basic information for your campaign</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter campaign name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Dataset Selection */}
            <div>
              <label htmlFor="dataset_id" className="block text-sm font-medium text-gray-700 mb-2">
                Dataset *
              </label>
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  Select a dataset that has been analyzed. Only analyzed datasets can be used for campaigns.
                </p>
              </div>

              {datasetsLoading ? (
                <div className="flex items-center justify-center py-12 border border-gray-300 rounded-lg">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-600">Loading datasets...</span>
                </div>
              ) : datasetsError ? (
                <div className="p-4 border border-red-300 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">Error loading datasets</p>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{datasetsError}</p>
                  <button
                    type="button"
                    onClick={refreshDatasets}
                    className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : availableDatasets.length === 0 ? (
                <div className="p-6 border border-gray-300 rounded-lg bg-gray-50 text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No analyzed datasets available</p>
                  <p className="text-sm text-gray-600 mb-4">
                    You need at least one analyzed dataset to create a campaign. 
                    Please upload and analyze a dataset first.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/dataset/add")}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                  >
                    Add Dataset
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDatasets.map((dataset) => (
                    <label
                      key={dataset.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.dataset_id === dataset.id
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="dataset_id"
                        value={dataset.id}
                        checked={formData.dataset_id === dataset.id}
                        onChange={(e) => handleInputChange("dataset_id", parseInt(e.target.value))}
                        className="sr-only"
                        disabled={isSubmitting}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Database className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dataset.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md">
                              Analyzed
                            </span>
                            <span className="text-xs text-gray-500">
                              Created {new Date(dataset.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                        formData.dataset_id === dataset.id
                          ? "border-gray-900 bg-gray-900"
                          : "border-gray-300"
                      }`}>
                        {formData.dataset_id === dataset.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              {errors.dataset_id && (
                <p className="mt-1 text-sm text-red-600">{errors.dataset_id}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-4 border border-red-300 rounded-lg bg-red-50">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">Failed to create campaign</p>
                </div>
                <p className="text-sm text-red-600 mt-1">{submitError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || availableDatasets.length === 0}
                className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
