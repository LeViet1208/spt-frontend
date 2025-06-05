// Campaign API service
export interface Campaign {
  id: number
  name: string
  datasetId: number
  status: "draft" | "active" | "paused" | "completed"
  promotionType: "discount" | "bogo" | "bundle" | "seasonal"
  startDate: string
  endDate: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CampaignResponse {
  success: boolean
  data?: Campaign[]
  error?: string
}

export interface CreateCampaignRequest {
  name: string
  datasetId: number
  promotionType: "discount" | "bogo" | "bundle" | "seasonal"
  startDate: string
  endDate: string
  description?: string
}

// Mock API functions - Replace these with real API calls later
export const campaignAPI = {
  // Get campaigns by dataset ID
  async getCampaignsByDataset(datasetId: number): Promise<CampaignResponse> {
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`/api/campaigns/dataset/${datasetId}`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // })
      // const data = await response.json()
      // return data

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

      const mockCampaigns: Campaign[] = [
        {
          id: 1,
          name: "Summer Sale 2024",
          datasetId,
          status: "active",
          promotionType: "discount",
          startDate: "2024-06-01",
          endDate: "2024-08-31",
          description: "20% off on all summer products",
          createdAt: "2024-05-15T10:30:00Z",
          updatedAt: "2024-05-15T10:30:00Z",
        },
        {
          id: 2,
          name: "Back to School",
          datasetId,
          status: "draft",
          promotionType: "bogo",
          startDate: "2024-08-15",
          endDate: "2024-09-15",
          description: "Buy one get one free on school supplies",
          createdAt: "2024-05-20T14:20:00Z",
          updatedAt: "2024-05-20T14:20:00Z",
        },
        {
          id: 3,
          name: "Holiday Bundle",
          datasetId,
          status: "completed",
          promotionType: "bundle",
          startDate: "2023-12-01",
          endDate: "2023-12-31",
          description: "Special holiday product bundles",
          createdAt: "2023-11-15T09:00:00Z",
          updatedAt: "2023-12-31T23:59:00Z",
        },
        {
          id: 4,
          name: "Flash Weekend Sale",
          datasetId,
          status: "paused",
          promotionType: "discount",
          startDate: "2024-03-01",
          endDate: "2024-03-03",
          description: "48-hour flash sale with deep discounts",
          createdAt: "2024-02-25T16:45:00Z",
          updatedAt: "2024-03-02T12:00:00Z",
        },
        {
          id: 5,
          name: "Spring Collection Launch",
          datasetId,
          status: "active",
          promotionType: "seasonal",
          startDate: "2024-03-20",
          endDate: "2024-05-20",
          description: "Introducing new spring collection with special offers",
          createdAt: "2024-03-10T11:30:00Z",
          updatedAt: "2024-03-20T08:00:00Z",
        },
        {
          id: 6,
          name: "Customer Loyalty Rewards",
          datasetId,
          status: "active",
          promotionType: "discount",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          description: "Year-long loyalty program with tiered discounts",
          createdAt: "2023-12-20T10:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ]

      return {
        success: true,
        data: mockCampaigns,
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      return {
        success: false,
        error: "Failed to fetch campaigns",
      }
    }
  },

  // Get all campaigns
  async getAllCampaigns(): Promise<CampaignResponse> {
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/campaigns', {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // })
      // const data = await response.json()
      // return data

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 800))
      return {
        success: true,
        data: [], // Will be populated with campaigns from all datasets
      }
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch campaigns",
      }
    }
  },

  // Create new campaign
  async createCampaign(request: CreateCampaignRequest): Promise<{ success: boolean; data?: Campaign; error?: string }> {
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/campaigns', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(request)
      // })
      // const data = await response.json()
      // return data

      // Mock creation for now
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newCampaign: Campaign = {
        id: Date.now(),
        name: request.name,
        datasetId: request.datasetId,
        status: "draft",
        promotionType: request.promotionType,
        startDate: request.startDate,
        endDate: request.endDate,
        description: request.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return {
        success: true,
        data: newCampaign,
      }
    } catch (error) {
      return {
        success: false,
        error: "Failed to create campaign",
      }
    }
  },
}
