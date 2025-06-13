"use client"

import {
  ArrowLeft,
  Calendar,
  Database,
  Edit,
  Plus,
  RefreshCw,
  Settings,
  Tag,
  Target,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { campaignAPI, type Campaign, type PromotionRule } from "@/lib/api/campaign"

interface CampaignDetailPageProps {
  params: {
    id: string
  }
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const campaignId = parseInt(params.id)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rulesError, setRulesError] = useState<string | null>(null)

  // Fetch campaign details and promotion rules
  const fetchCampaignData = async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, we'll get campaign from the list since there's no single campaign endpoint
      const response = await campaignAPI.getAllCampaigns()
      
      if (response.success && response.data) {
        const foundCampaign = response.data.find(c => c.campaign_id === campaignId)
        if (foundCampaign) {
          setCampaign(foundCampaign)
          await fetchPromotionRules()
        } else {
          setError("Campaign not found")
        }
      } else {
        setError(response.error || "Failed to fetch campaign")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching campaign:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPromotionRules = async () => {
    try {
      setRulesLoading(true)
      setRulesError(null)

      const response = await campaignAPI.getPromotionRules(campaignId)
      
      if (response.success && response.data) {
        setPromotionRules(response.data)
      } else {
        setRulesError(response.error || "Failed to fetch promotion rules")
      }
    } catch (err) {
      setRulesError("An unexpected error occurred")
      console.error("Error fetching promotion rules:", err)
    } finally {
      setRulesLoading(false)
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData()
    }
  }, [campaignId])

  const handleBack = () => {
    router.back()
  }

  const handleAddPromotionRule = () => {
    router.push(`/campaign/${campaignId}/promotion-rule/new`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getRuleTypeDisplay = (ruleType: string) => {
    switch (ruleType) {
      case "price_reduction":
        return "Price Reduction"
      default:
        return ruleType
    }
  }

  const getTargetTypeDisplay = (targetType: string) => {
    switch (targetType) {
      case "category":
        return "Category"
      case "brand":
        return "Brand"
      case "upc":
        return "UPC"
      default:
        return targetType
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">Loading campaign details...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium mb-2">Error loading campaign</p>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-sm text-gray-500">Campaign Details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm rounded-md ${
                campaign.is_active 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {campaign.is_active ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => {/* TODO: Implement edit */}}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Campaign Name</p>
                    <p className="text-sm text-gray-900">{campaign.name}</p>
                  </div>
                </div>

                {campaign.description && (
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-sm text-gray-900">{campaign.description}</p>
                    </div>
                  </div>
                )}

                {campaign.dataset && (
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Dataset</p>
                      <p className="text-sm text-gray-900">
                        {campaign.dataset.name || `Dataset ID: ${campaign.dataset.dataset_id}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-900">{formatDate(campaign.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Promotion Rules</p>
                    <p className="text-sm text-gray-900">{campaign.promotion_rules_count} rules</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promotion Rules */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Promotion Rules</h3>
                <button
                  onClick={handleAddPromotionRule}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {rulesLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
                    <p className="text-gray-500">Loading promotion rules...</p>
                  </div>
                ) : rulesError ? (
                  <div className="p-8 text-center text-red-600">
                    <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-400" />
                    <p className="text-sm mb-4">{rulesError}</p>
                    <button
                      onClick={fetchPromotionRules}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : promotionRules.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No promotion rules</p>
                    <p className="text-sm mb-4">Add your first promotion rule to get started</p>
                    <button
                      onClick={handleAddPromotionRule}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                    >
                      Add Rule
                    </button>
                  </div>
                ) : (
                  promotionRules.map((rule) => (
                    <div key={rule.promotion_rule_id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-md ${
                              rule.is_active 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {rule.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Rule Type</p>
                              <p className="text-sm text-gray-900">{getRuleTypeDisplay(rule.rule_type)}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700">Target Type</p>
                              <p className="text-sm text-gray-900">{getTargetTypeDisplay(rule.target_type)}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700">Start Date</p>
                              <p className="text-sm text-gray-900">{formatTime(rule.start_date)}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700">End Date</p>
                              <p className="text-sm text-gray-900">{formatTime(rule.end_date)}</p>
                            </div>
                            
                            {rule.price_reduction_percentage && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Price Reduction</p>
                                <p className="text-sm text-gray-900">{(rule.price_reduction_percentage * 100).toFixed(1)}%</p>
                              </div>
                            )}
                            
                            {rule.target_categories && rule.target_categories.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Target Categories</p>
                                <p className="text-sm text-gray-900">{rule.target_categories.join(", ")}</p>
                              </div>
                            )}
                            
                            {rule.target_brands && rule.target_brands.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Target Brands</p>
                                <p className="text-sm text-gray-900">{rule.target_brands.join(", ")}</p>
                              </div>
                            )}
                            
                            {rule.target_upcs && rule.target_upcs.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Target UPCs</p>
                                <p className="text-sm text-gray-900">{rule.target_upcs.join(", ")}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {/* TODO: Implement edit rule */}}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Edit Rule"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement delete rule */}}
                            className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Delete Rule"
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
        </div>
      </div>
    </div>
  )
}
