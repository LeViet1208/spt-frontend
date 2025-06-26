"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { campaignAPI, type Campaign, type PromotionRule } from '@/utils/api/campaign'
import {
  Plus,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Megaphone,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  Database,
  Target,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Dynamically import components to avoid SSR issues
const CampaignDetailView = dynamic(() => import('./[id]/page'), { 
  ssr: false,
  loading: () => <div className="space-y-6"><Card><CardContent className="p-8"><div className="flex items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Loading campaign details...</span></div></CardContent></Card></div>
})

const CampaignCreateView = dynamic(() => import('./new/page'), { 
  ssr: false,
  loading: () => <div className="space-y-6"><Card><CardContent className="p-8"><div className="flex items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Loading campaign form...</span></div></CardContent></Card></div>
})

export default function CampaignsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const view = searchParams.get('view')
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Campaign state
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [campaignLoading, setCampaignLoading] = useState(false)
  const [campaignError, setCampaignError] = useState<string | null>(null)
  const [promotionRules, setPromotionRules] = useState<{ [campaignId: number]: PromotionRule[] }>({})
  const [promotionRulesLoading, setPromotionRulesLoading] = useState<{ [campaignId: number]: boolean }>({})

  // Handle navigation
  const handleAddCampaign = () => {
    router.push("/campaigns?view=new")
  }

  const handleBack = () => {
    router.push("/campaigns")
  }

  const handleRefresh = () => {
    fetchAllCampaigns()
  }

  const fetchAllCampaigns = async () => {
    try {
      setCampaignLoading(true)
      setCampaignError(null)

      const response = await campaignAPI.getAllCampaigns()

      if (response.success && response.data) {
        setAllCampaigns(response.data)
        
        // Fetch promotion rules for each campaign
        for (const campaign of response.data) {
          fetchPromotionRules(campaign.campaign_id)
        }
      } else {
        setCampaignError(response.error || "Failed to fetch campaigns")
      }
    } catch (err) {
      setCampaignError("An unexpected error occurred")
      console.error("Error fetching campaigns:", err)
    } finally {
      setCampaignLoading(false)
    }
  }

  const fetchPromotionRules = async (campaignId: number) => {
    try {
      setPromotionRulesLoading(prev => ({ ...prev, [campaignId]: true }))
      
      const response = await campaignAPI.getPromotionRules(campaignId)
      
      if (response.success && response.data) {
        setPromotionRules(prev => ({ ...prev, [campaignId]: response.data! }))
      }
    } catch (err) {
      console.error("Error fetching promotion rules:", err)
    } finally {
      setPromotionRulesLoading(prev => ({ ...prev, [campaignId]: false }))
    }
  }

  // Debounce search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchAllCampaigns()
  }, [])

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = allCampaigns

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = allCampaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(query) ||
        (campaign.description && campaign.description.toLowerCase().includes(query))
      )
    }

    // Apply sorting by date created
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [allCampaigns, debouncedSearchQuery, sortOrder])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle sort order toggle
  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  // Handle campaign click
  const handleCampaignClick = (campaign: Campaign) => {
    router.push(`/campaigns?id=${campaign.campaign_id}`)
  }

  // If we have an ID, show the detail view
  if (id) {
    return <CampaignDetailView />
  }

  // If view is new, show the create form
  if (view === 'new') {
    return <CampaignCreateView />
  }

  // Helper functions for rendering
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    }
    return <Badge variant="outline">
      Inactive
    </Badge>
  }

  const formatRuleType = (ruleType: string) => {
    switch (ruleType) {
      case "price_reduction":
        return "Price Reduction"
      default:
        return ruleType
    }
  }

  const formatTargetType = (targetType: string) => {
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

  const formatDateRange = (startDate: number, endDate: number) => {
    const start = new Date(startDate * 1000).toLocaleDateString()
    const end = new Date(endDate * 1000).toLocaleDateString()
    return `${start} - ${end}`
  }

  // Render the main campaigns list view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns</h1>
        <p className="text-muted-foreground">Create and manage your promotion campaigns.</p>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search campaigns by name or description..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            
            {/* Sort Button */}
            <Button
              variant="outline"
              onClick={handleSortToggle}
              className="flex items-center gap-2"
            >
              {sortOrder === 'desc' ? (
                <SortDesc className="h-4 w-4" />
              ) : (
                <SortAsc className="h-4 w-4" />
              )}
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={campaignLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${campaignLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {/* Add Campaign Button */}
            <Button onClick={handleAddCampaign} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Campaign
            </Button>
          </div>
          
          {/* Search Results Count */}
          {debouncedSearchQuery.trim() && (
            <div className="mt-2 text-sm text-muted-foreground">
              {filteredAndSortedCampaigns.length} campaign{filteredAndSortedCampaigns.length !== 1 ? 's' : ''} found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign List */}
      <div className="space-y-4">
        {campaignLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Loading campaigns...</p>
            </CardContent>
          </Card>
        ) : campaignError ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <CardTitle className="text-lg mb-2 text-destructive">Error loading campaigns</CardTitle>
              <CardDescription className="mb-4">{campaignError}</CardDescription>
              <Button onClick={handleRefresh} variant="destructive">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedCampaigns.length === 0 && debouncedSearchQuery.trim() ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="text-lg mb-2">No campaigns match your search</CardTitle>
              <CardDescription>Try adjusting your search terms</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredAndSortedCampaigns.map((campaign) => (
              <Card 
                key={campaign.campaign_id} 
                className="hover:shadow-md cursor-pointer transition-shadow duration-200"
                onClick={() => handleCampaignClick(campaign)}
              >
                <CardContent className="p-6">
                  {/* Main Campaign Information */}
                  <div className="flex items-start justify-between mb-4">
                    {/* Left side - Campaign info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Megaphone className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{campaign.name}</CardTitle>
                        {campaign.description && (
                          <CardDescription className="mb-2 max-w-2xl">{campaign.description}</CardDescription>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created {new Date(campaign.created_at || '').toLocaleDateString()}</span>
                          </div>
                          {campaign.dataset && (
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <span>Dataset: {campaign.dataset.name || `ID ${campaign.dataset.dataset_id}`}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Campaign Status */}
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(campaign.is_active)}
                      
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        <Target className="h-3 w-3 mr-1" />
                        {campaign.promotion_rules_count} rule{campaign.promotion_rules_count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Promotion Rules Section */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Promotion Rules</h4>
                    
                    {promotionRulesLoading[campaign.campaign_id] ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Loading promotion rules...</span>
                      </div>
                    ) : !promotionRules[campaign.campaign_id] || promotionRules[campaign.campaign_id].length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No promotion rules found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {promotionRules[campaign.campaign_id].slice(0, 3).map((rule) => (
                          <div key={rule.promotion_rule_id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="text-sm font-medium">{rule.name}</h5>
                                  {getStatusBadge(rule.is_active)}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Type:</span>
                                    <span>{formatRuleType(rule.rule_type)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Target:</span>
                                    <span>{formatTargetType(rule.target_type)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Duration:</span>
                                    <span>{formatDateRange(rule.start_date, rule.end_date)}</span>
                                  </div>
                                </div>

                                {/* Rule Details */}
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                  {rule.price_reduction_percentage && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                      -{(rule.price_reduction_percentage * 100).toFixed(1)}% off
                                    </Badge>
                                  )}
                                  {rule.price_reduction_amount && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                      -${rule.price_reduction_amount} off
                                    </Badge>
                                  )}
                                  {rule.feature_enabled && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                  {rule.display_enabled && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                      Display
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {promotionRules[campaign.campaign_id].length > 3 && (
                          <div className="text-center py-2">
                            <span className="text-xs text-muted-foreground">
                              +{promotionRules[campaign.campaign_id].length - 3} more rules
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Campaign Empty Card */}
            {!debouncedSearchQuery.trim() && (
              <Card 
                className="hover:shadow-md cursor-pointer transition-shadow duration-200 border-dashed"
                onClick={handleAddCampaign}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 hover:bg-muted/80 transition-colors">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg mb-2">Create New Campaign</CardTitle>
                      <CardDescription>Click here to create a new promotion campaign</CardDescription>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show empty state only when no campaigns exist */}
            {filteredAndSortedCampaigns.length === 0 && !debouncedSearchQuery.trim() && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="text-lg mb-2">No campaigns found</CardTitle>
                  <CardDescription className="mb-4">Get started by creating your first campaign</CardDescription>
                  <Button onClick={handleAddCampaign}>
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
