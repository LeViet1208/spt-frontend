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
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCampaign } from "@/hooks/useCampaign"
import type { Campaign, PromotionRule } from "@/utils/types/campaign"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface CampaignDetailPageProps {
  params?: {
    id: string
  }
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get campaign ID from either params or search params
  const campaignId = parseInt(params?.id || searchParams.get('id') || '0')

  // Use campaign hook
  const { allCampaigns, isLoading: campaignsLoading, error: campaignsError, fetchAllCampaigns, fetchPromotionRules: hookFetchPromotionRules } = useCampaign()

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

      // Get campaign from the allCampaigns list
      await fetchAllCampaigns()
      
      if (allCampaigns.length > 0) {
        const foundCampaign = allCampaigns.find((c: Campaign) => c.campaign_id === campaignId)
        if (foundCampaign) {
          setCampaign(foundCampaign)
          await fetchPromotionRulesData()
        } else {
          setError("Campaign not found")
        }
      } else if (campaignsError) {
        setError(campaignsError)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching campaign:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPromotionRulesData = async () => {
    try {
      setRulesLoading(true)
      setRulesError(null)

      const rules = await hookFetchPromotionRules(campaignId)
      
      if (rules) {
        setPromotionRules(rules)
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
  }, [campaignId, allCampaigns])

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
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading campaign details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <CardTitle className="text-lg mb-2 text-destructive">Error loading campaign</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={handleBack} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                size="icon"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                <CardDescription>Campaign Details</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary"
                className={campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
              >
                {campaign.is_active ? "Active" : "Inactive"}
              </Badge>
              <Button onClick={() => {/* TODO: Implement edit */}}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">{campaign.promotion_rules_count} rules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promotion Rules */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Promotion Rules</CardTitle>
                <Button onClick={handleAddPromotionRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
                  <p className="text-muted-foreground">Loading promotion rules...</p>
                </div>
              ) : rulesError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                  <CardDescription className="mb-4">{rulesError}</CardDescription>
                  <Button onClick={fetchPromotionRulesData} variant="destructive">
                    Try Again
                  </Button>
                </div>
              ) : promotionRules.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="text-lg mb-2">No promotion rules</CardTitle>
                  <CardDescription className="mb-4">Add your first promotion rule to get started</CardDescription>
                  <Button onClick={handleAddPromotionRule}>
                    Add Rule
                  </Button>
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium">Rule Type</p>
                                <p className="text-sm text-muted-foreground">{getRuleTypeDisplay(rule.rule_type)}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium">Target Type</p>
                                <p className="text-sm text-muted-foreground">{getTargetTypeDisplay(rule.target_type)}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium">Start Date</p>
                                <p className="text-sm text-muted-foreground">{formatTime(rule.start_date)}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium">End Date</p>
                                <p className="text-sm text-muted-foreground">{formatTime(rule.end_date)}</p>
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
                              onClick={() => {/* TODO: Implement edit rule */}}
                              title="Edit Rule"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {/* TODO: Implement delete rule */}}
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
    </div>
  )
}
