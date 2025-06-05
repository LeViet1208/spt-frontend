"use client"

import { useState, useCallback } from "react"
import { campaignAPI, type Campaign } from "@/lib/api/campaign"

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<{ [datasetId: number]: Campaign[] }>({})
  const [loading, setLoading] = useState<{ [datasetId: number]: boolean }>({})
  const [error, setError] = useState<{ [datasetId: number]: string | null }>({})

  // Fetch campaigns for a specific dataset
  const fetchCampaignsByDataset = useCallback(async (datasetId: number) => {
    try {
      setLoading((prev) => ({ ...prev, [datasetId]: true }))
      setError((prev) => ({ ...prev, [datasetId]: null }))

      const response = await campaignAPI.getCampaignsByDataset(datasetId)

      if (response.success && response.data) {
        setCampaigns((prev) => ({ ...prev, [datasetId]: response.data! }))
      } else {
        setError((prev) => ({ ...prev, [datasetId]: response.error || "Failed to fetch campaigns" }))
      }
    } catch (err) {
      setError((prev) => ({ ...prev, [datasetId]: "An unexpected error occurred" }))
      console.error("Error in fetchCampaignsByDataset:", err)
    } finally {
      setLoading((prev) => ({ ...prev, [datasetId]: false }))
    }
  }, [])

  // Get campaigns for a dataset (from cache or fetch)
  const getCampaignsForDataset = useCallback(
    (datasetId: number) => {
      if (!campaigns[datasetId] && !loading[datasetId]) {
        fetchCampaignsByDataset(datasetId)
      }
      return {
        campaigns: campaigns[datasetId] || [],
        loading: loading[datasetId] || false,
        error: error[datasetId] || null,
      }
    },
    [campaigns, loading, error, fetchCampaignsByDataset],
  )

  return {
    getCampaignsForDataset,
    fetchCampaignsByDataset,
    campaigns,
    loading,
    error,
  }
}
