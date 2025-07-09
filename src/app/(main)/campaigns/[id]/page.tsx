"use client"

import {
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
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCampaign } from "@/hooks/useCampaign"
import { useNotifications } from "@/hooks/useNotifications"
import { PromotionRuleForm } from "@/components/PromotionRuleForm"
import { EditCampaignModal } from "@/components/EditCampaignModal"
import type { Campaign, PromotionRule } from "@/utils/types/campaign"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface CampaignDetailPageProps {
  params: {
    id: string
  }
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const router = useRouter()
  const campaignId = parseInt(params.id)
  const { showInfoNotification } = useNotifications()

  // Campaign hook
  const { fetchAllCampaigns, fetchPromotionRules } = useCampaign()

  // Local state
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rulesError, setRulesError] = useState<string | null>(null)

  // Fetch campaign data
  const fetchCampaignData = useCallback(async () => {
    if (!campaignId) return

    try {
      setLoading(true)
      setError(null)

      const campaignsResponse = await fetchAllCampaigns()
      if (campaignsResponse?.success && campaignsResponse.data) {
        const foundCampaign = campaignsResponse.data.find(
          (c: Campaign) => c.campaign_id === campaignId
        )
        
        if (foundCampaign) {
          setCampaign(foundCampaign)
        } else {
          setError("Campaign not found")
        }
      } else {
        setError(campaignsResponse?.error || "Failed to fetch campaign")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching campaign:", err)
    } finally {
      setLoading(false)
    }
  }, [campaignId, fetchAllCampaigns])

  // Fetch promotion rules
  const fetchPromotionRulesData = useCallback(async () => {
    if (!campaignId) return

    try {
      setRulesLoading(true)
      setRulesError(null)

      const rulesResponse = await fetchPromotionRules(campaignId)
      if (rulesResponse?.success && rulesResponse.data) {
        setPromotionRules(rulesResponse.data)
      } else {
        setRulesError(rulesResponse?.error || "Failed to fetch promotion rules")
      }
    } catch (err) {
      setRulesError("An unexpected error occurred")
      console.error("Error fetching promotion rules:", err)
    } finally {
      setRulesLoading(false)
    }
  }, [campaignId, fetchPromotionRules])

  // Initial data fetch
  useEffect(() => {
    fetchCampaignData()
  }, [fetchCampaignData])

  // Fetch promotion rules after campaign is loaded
  useEffect(() => {
    if (campaign) {
      fetchPromotionRulesData()
    }
  }, [campaign, fetchPromotionRulesData])

  const handlePromotionRuleSuccess = () => {
    // Refresh promotion rules after successful creation
    fetchPromotionRulesData()
  }

  const handleEditRule = (ruleId: number) => {
    // TODO: Implement edit functionality
    showInfoNotification(
      "Edit functionality coming soon - This feature will be available in a future update."
    )
  }

  const handleDeleteRule = (ruleId: number) => {
    // TODO: Implement delete functionality
    showInfoNotification(
      "Delete functionality coming soon - This feature will be available in a future update."
    )
  }

  const handleCampaignUpdateSuccess = () => {
    // Refresh campaign data after successful update
    fetchCampaignData()
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
      case "product_size_increase":
        return "Product Size Increase"
      case "feature_yes_no":
        return "Feature Yes/No"
      case "display_yes_no":
        return "Display Yes/No"
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
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading campaign details...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <CardTitle className="text-lg mb-2 text-destructive">Error loading campaign</CardTitle>
          <CardDescription className="mb-4">{error}</CardDescription>
          <Button onClick={() => router.push('/campaigns')} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Main Content - Vertical Column Layout */}
      <div className="h-full flex flex-col gap-6">
        {/* Campaign Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaign Information</CardTitle>
              <div className="flex items-center gap-3">
                <EditCampaignModal
                  campaign={campaign}
                  onSuccess={handleCampaignUpdateSuccess}
                  trigger={
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Campaign
                    </Button>
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Campaign Name</p>
                  <p className="text-sm text-muted-foreground">{campaign.name}</p>
                </div>
              </div>

              {campaign.description && (
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  </div>
                </div>
              )}

              {campaign.dataset && (
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dataset</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.dataset.name || `Dataset ID: ${campaign.dataset.dataset_id}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">{formatDate(campaign.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Promotion Rules</p>
                  <p className="text-sm text-muted-foreground">
                    {promotionRules.length} {promotionRules.length === 1 ? 'rule' : 'rules'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotion Rules */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Promotion Rules</CardTitle>
              <PromotionRuleForm
                campaignId={campaignId}
                onSuccess={handlePromotionRuleSuccess}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
                <p className="text-muted-foreground">Loading promotion rules...</p>
              </div>
            ) : rulesError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                <CardDescription className="mb-4">{rulesError}</CardDescription>
                <Button onClick={fetchPromotionRulesData} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : promotionRules.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="text-lg mb-2">No promotion rules</CardTitle>
                <CardDescription className="mb-4">
                  Add your first promotion rule to get started
                </CardDescription>
                <PromotionRuleForm
                  campaignId={campaignId}
                  onSuccess={handlePromotionRuleSuccess}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-4">
                {promotionRules.map((rule, index) => (
                  <div key={rule.promotion_rule_id}>
                    {index > 0 && <Separator />}
                    <div className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <CardTitle className="text-lg">{rule.name}</CardTitle>
                            <Badge 
                              variant="secondary"
                              className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                            >
                              {rule.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium">Rule Type</p>
                                <p className="text-sm text-muted-foreground">{getRuleTypeDisplay(rule.rule_type)}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium">Target Type</p>
                                <p className="text-sm text-muted-foreground">{getTargetTypeDisplay(rule.target_type)}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium">Start Date</p>
                                <p className="text-sm text-muted-foreground">{formatTime(rule.start_date)}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium">End Date</p>
                                <p className="text-sm text-muted-foreground">{formatTime(rule.end_date)}</p>
                              </div>
                            </div>
                            
                            {rule.price_reduction_percentage && (
                              <div>
                                <p className="text-sm font-medium">Price Reduction</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  {(rule.price_reduction_percentage * 100).toFixed(1)}% off
                                </Badge>
                              </div>
                            )}
                            
                            {rule.target_categories && rule.target_categories.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">Target Categories</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rule.target_categories.map((category, idx) => (
                                    <Badge key={idx} variant="outline">{category}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rule.target_brands && rule.target_brands.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">Target Brands</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rule.target_brands.map((brand, idx) => (
                                    <Badge key={idx} variant="outline">{brand}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {rule.target_upcs && rule.target_upcs.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">Target UPCs</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rule.target_upcs.map((upc, idx) => (
                                    <Badge key={idx} variant="outline">{upc}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditRule(rule.promotion_rule_id)}
                            title="Edit Rule"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteRule(rule.promotion_rule_id)}
                            title="Delete Rule"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
