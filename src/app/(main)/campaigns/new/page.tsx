"use client"

import {
  ArrowLeft,
  Database,
  Megaphone,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDatasets } from "@/hooks/useDataset"
import { campaignAPI, type CreateCampaignRequest } from "@/utils/api/campaign"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function NewCampaignPage() {
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
    router.push("/campaigns")
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Create New Campaign</CardTitle>
              <CardDescription>Set up a new promotion campaign</CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Megaphone className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>Provide basic information for your campaign</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Campaign Name *
              </label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter campaign name"
                disabled={isSubmitting}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Dataset Selection */}
            <div className="space-y-3">
              <label htmlFor="dataset_id" className="text-sm font-medium">
                Dataset *
              </label>
              <CardDescription>
                Select a dataset that has been analyzed. Only analyzed datasets can be used for campaigns.
              </CardDescription>

              {datasetsLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading datasets...</span>
                  </CardContent>
                </Card>
              ) : datasetsError ? (
                <Card className="border-destructive">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm font-medium">Error loading datasets</p>
                    </div>
                    <p className="text-sm text-destructive mt-1">{datasetsError}</p>
                    <Button
                      type="button"
                      onClick={refreshDatasets}
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : availableDatasets.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <CardTitle className="text-lg mb-2">No analyzed datasets available</CardTitle>
                    <CardDescription className="mb-4">
                      You need at least one analyzed dataset to create a campaign. 
                      Please upload and analyze a dataset first.
                    </CardDescription>
                    <Button
                      type="button"
                      onClick={() => router.push("/dataset/add")}
                    >
                      Add Dataset
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {availableDatasets.map((dataset) => (
                    <Card
                      key={dataset.id}
                      className={`cursor-pointer transition-colors ${
                        formData.dataset_id === dataset.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => !isSubmitting && handleInputChange("dataset_id", dataset.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <Database className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dataset.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                Analyzed
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Created {new Date(dataset.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                            formData.dataset_id === dataset.id
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}>
                            {formData.dataset_id === dataset.id && (
                              <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {errors.dataset_id && (
                <p className="text-sm text-destructive">{errors.dataset_id}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">Failed to create campaign</p>
                  </div>
                  <p className="text-sm text-destructive mt-1">{submitError}</p>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || availableDatasets.length === 0}
                className="flex items-center gap-2"
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
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
