"use client"
import { Calendar, Tag, Eye, ExternalLink } from "lucide-react"
import { useCampaigns } from "@/hooks/use-campaigns"
import { useRouter } from "next/navigation"
import type { Campaign } from "@/lib/api/campaign"

interface CampaignPopupProps {
  datasetId: number
  isVisible: boolean
  onClose: () => void
}

export default function CampaignPopup({ datasetId, isVisible, onClose }: CampaignPopupProps) {
  const { getCampaignsForDataset } = useCampaigns()
  const router = useRouter()
  const { campaigns, loading, error } = getCampaignsForDataset(datasetId)

  // Show only first 5 campaigns
  const displayCampaigns = campaigns.slice(0, 5)
  const hasMoreCampaigns = campaigns.length > 5

  const handleViewAllCampaigns = () => {
    router.push(`/dataset/${datasetId}/campaigns`)
    onClose()
  }

  const handleViewCampaign = (campaignId: number) => {
    router.push(`/campaign/${campaignId}`)
    onClose()
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

  if (!isVisible) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-2 mx-4 animate-in slide-in-from-top-2 duration-200 z-20 relative">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Campaigns ({campaigns.length})</h4>
        <button
          onClick={(e) => {
            e.stopPropagation() // Ngăn sự kiện lan truyền
            onClose()
          }}
          className="text-gray-400 hover:text-gray-600 text-sm"
          aria-label="Close popup"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-sm text-gray-600">Loading campaigns...</span>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : displayCampaigns.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No campaigns found</p>
          <button
            onClick={() => router.push(`/dataset/${datasetId}/campaigns/new`)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Create your first campaign
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">{getPromotionTypeIcon(campaign.promotionType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{campaign.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      <span className="capitalize">{campaign.promotionType}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation() // Ngăn sự kiện lan truyền
                  handleViewCampaign(campaign.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                title="View campaign"
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          ))}

          {/* View All Button */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation() // Ngăn sự kiện lan truyền
                handleViewAllCampaigns()
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              <span>View all campaigns {hasMoreCampaigns && `(${campaigns.length - 5} more)`}</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
