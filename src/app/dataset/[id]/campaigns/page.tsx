"use client"

import { BarChart3, ArrowLeft, Plus, Calendar, Tag, Eye, Edit, Trash2, Search } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { useCampaigns } from "@/hooks/use-campaigns"
import type { Campaign } from "@/lib/api/campaign"

export default function DatasetCampaignsPage() {
  const router = useRouter()
  const params = useParams()
  const datasetId = Number.parseInt(params.id as string)
  const { getCampaignsForDataset } = useCampaigns()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { campaigns, loading, error } = getCampaignsForDataset(datasetId)

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleBack = () => {
    router.push("/dashboard")
  }

  const handleCreateCampaign = () => {
    router.push(`/dataset/${datasetId}/campaigns/new`)
  }

  const handleViewCampaign = (campaignId: number) => {
    router.push(`/campaign/${campaignId}`)
  }

  const handleEditCampaign = (campaignId: number) => {
    router.push(`/campaign/${campaignId}/edit`)
  }

  const handleDeleteCampaign = (campaignId: number) => {
    // Will implement delete functionality
    console.log("Delete campaign:", campaignId)
  }

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPromotionTypeIcon = (type: Campaign["promotionType"]) => {
    switch (type) {
      case "discount":
        return "💰"
      case "bogo":
        return "🎁"
      case "bundle":
        return "📦"
      case "seasonal":
        return "🌟"
      default:
        return "🏷️"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SPT Analytics</h1>
              <p className="text-xs text-gray-500">Dataset Campaigns</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Page Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dataset Campaigns</h2>
                <p className="text-gray-600 mt-1">Manage all campaigns for this dataset</p>
              </div>
              <button
                onClick={handleCreateCampaign}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Campaigns List */}
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading campaigns...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">
                  <p className="text-lg font-medium mb-2">Error loading campaigns</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-medium mb-2">
                    {searchTerm || statusFilter !== "all" ? "No campaigns match your filters" : "No campaigns found"}
                  </p>
                  <p className="text-sm mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first campaign to get started"}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <button
                      onClick={handleCreateCampaign}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create Campaign
                    </button>
                  )}
                </div>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{getPromotionTypeIcon(campaign.promotionType)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                            <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                          {campaign.description && <p className="text-gray-600 mb-2">{campaign.description}</p>}
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                                {new Date(campaign.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              <span className="capitalize">{campaign.promotionType}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCampaign(campaign.id)}
                          className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors"
                          title="View campaign"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditCampaign(campaign.id)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                          title="Edit campaign"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                          title="Delete campaign"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
