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
  List,
  Grid,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCampaign } from "@/hooks/useCampaign"
import { useNotifications } from "@/hooks/useNotifications"
import { PromotionRuleForm } from "@/components/PromotionRuleForm"
import { EditCampaignModal } from "@/components/EditCampaignModal"
import { EditPromotionRuleModal } from "@/components/EditPromotionRuleModal"
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
  const { fetchAllCampaigns, fetchPromotionRules, deletePromotionRule } = useCampaign()

  // Local state
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rulesError, setRulesError] = useState<string | null>(null)

  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

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

  const handleDeleteRule = async (ruleId: number) => {
    try {
      const result = await deletePromotionRule(campaignId, ruleId)
      if (result) {
        // Refresh promotion rules after successful deletion
        fetchPromotionRulesData()
      }
    } catch (error) {
      console.error("Error deleting promotion rule:", error)
    }
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
      // New rule types
      case "discount":
        return "Discount"
      case "upsizing":
        return "Upsizing"
      case "to_be_featured":
        return "To Be Featured"
      case "to_be_displayed":
        return "To Be Displayed"
      // Legacy rule types (for backward compatibility)
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
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    aria-label="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
                
                {campaign.dataset?.dataset_id && (
                  <PromotionRuleForm
                    campaignId={campaignId}
                    datasetId={campaign.dataset.dataset_id}
                    onSuccess={handlePromotionRuleSuccess}
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    }
                  />
                )}
              </div>
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
                {campaign.dataset?.dataset_id && (
                  <PromotionRuleForm
                    campaignId={campaignId}
                    datasetId={campaign.dataset.dataset_id}
                    onSuccess={handlePromotionRuleSuccess}
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
                {promotionRules.map((rule) => {
                  // Helper function to get all targets for this rule
                  const getAllTargets = () => {
                    const targets = []
                    if (rule.target_categories) targets.push(...rule.target_categories)
                    if (rule.target_brands) targets.push(...rule.target_brands)
                    if (rule.target_upcs) targets.push(...rule.target_upcs)
                    return targets
                  }

                  const allTargets = getAllTargets()
                  const maxTargets = viewMode === 'list' ? 5 : 3
                  const displayTargets = allTargets.slice(0, maxTargets)
                  const hasMoreTargets = allTargets.length > maxTargets

                  return (
                    <Card 
                      key={rule.promotion_rule_id} 
                      className="hover:shadow-md transition-shadow duration-200"
                    >
                      <CardContent>
                        {viewMode === 'list' ? (
                          /* List View Layout */
                          <div className="flex gap-4 items-center">
                            {/* Icon Column */}
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              <Target className="h-5 w-5 text-muted-foreground" />
                            </div>
                            
                            {/* Content Column */}
                            <div className="flex-1 flex flex-col gap-2">
                              {/* Row 1: Rule name, Date range */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                  <CardTitle className="text-base">{rule.name}</CardTitle>
                                  <span className="text-muted-foreground">•</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatTime(rule.start_date)} - {formatTime(rule.end_date)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Row 2: Target type, Rule type, and corresponding values */}
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                  {getTargetTypeDisplay(rule.target_type)}
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  {getRuleTypeDisplay(rule.rule_type)}
                                </Badge>
                                
                                {/* Rule-specific values */}
                                {rule.price_reduction_percentage != 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    {(rule.price_reduction_percentage)}% off
                                  </Badge>
                                )}
                                {rule.price_reduction_amount != 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    ${rule.price_reduction_amount} off
                                  </Badge>
                                )}
                                {rule.size_increase_percentage != 0 && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                    +{(rule.size_increase_percentage)}% size
                                  </Badge>
                                )}
                                {rule.feature_enabled && rule.rule_type === "to_be_featured" && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                    Featured
                                  </Badge>
                                )}
                                {rule.display_enabled && rule.rule_type === "to_be_displayed" && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    Displayed
                                  </Badge>
                                )}
                              </div>

                              {/* Row 3: Display first 5 target values */}
                              <div className="flex flex-wrap gap-1">
                                {displayTargets.map((target, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{target}</Badge>
                                ))}
                                {hasMoreTargets && (
                                  <Badge variant="outline" className="text-xs">
                                    +{allTargets.length - maxTargets} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons Column */}
                            <div className="flex items-center gap-2 ml-4">
                              {campaign.dataset?.dataset_id && (
                                <EditPromotionRuleModal
                                  promotionRule={rule}
                                  campaignId={campaignId}
                                  datasetId={campaign.dataset.dataset_id}
                                  onSuccess={handlePromotionRuleSuccess}
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      title="Edit Rule"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                              )}
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
                        ) : (
                          /* Grid View Layout */
                          <div className="flex items-center gap-4">
                            {/* Icon Column */}
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              <Target className="h-8 w-8 text-muted-foreground" />
                            </div>
                            
                            {/* Content Column */}
                            <div className="flex-1 flex flex-col gap-2">
                              {/* Row 1: Rule name */}
                              <CardTitle className="text-base leading-tight">{rule.name}</CardTitle>

                              {/* Row 2: Target type, Rule type, and corresponding values */}
                              <div className="flex flex-wrap items-center gap-2">
                                
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                  {getTargetTypeDisplay(rule.target_type)}
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  {getRuleTypeDisplay(rule.rule_type)}
                                </Badge>
                                
                                {/* Rule-specific values */}
                                {rule.price_reduction_percentage != 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    {(rule.price_reduction_percentage)}% off
                                  </Badge>
                                )}
                                {rule.price_reduction_amount != 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    ${rule.price_reduction_amount} off
                                  </Badge>
                                )}
                                {rule.size_increase_percentage != 0 && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                    +{(rule.size_increase_percentage)}% size
                                  </Badge>
                                )}
                                {rule.feature_enabled && rule.rule_type === "to_be_featured" && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                    Featured
                                  </Badge>
                                )}
                                {rule.display_enabled && rule.rule_type === "to_be_displayed" && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    Displayed
                                  </Badge>
                                )}
                              </div>

                              {/* Row 3: Display first 3 target values */}
                              <div className="flex flex-wrap gap-1">
                                {displayTargets.map((target, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{target}</Badge>
                                ))}
                                {hasMoreTargets && (
                                  <Badge variant="outline" className="text-xs">
                                    +{allTargets.length - maxTargets} more
                                  </Badge>
                                )}
                              </div>

                              {/* Row 4: Date range */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{formatTime(rule.start_date)} - {formatTime(rule.end_date)}</span>
                              </div>
                            </div>

                            {/* Action Buttons Column - Stacked vertically */}
                            <div className="flex flex-col gap-2 ml-4">
                              {campaign.dataset?.dataset_id && (
                                <EditPromotionRuleModal
                                  promotionRule={rule}
                                  campaignId={campaignId}
                                  datasetId={campaign.dataset.dataset_id}
                                  onSuccess={handlePromotionRuleSuccess}
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      title="Edit Rule"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                              )}
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
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
