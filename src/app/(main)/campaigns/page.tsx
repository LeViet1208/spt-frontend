"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useCampaign } from '@/hooks/useCampaign'
import type { Campaign, PromotionRule } from '@/utils/types/campaign'
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
  List, // Added for list view icon
  Grid, // Added for grid view icon
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
  
  // Use campaign hook
  const { allCampaigns, isLoading: campaignLoading, error: campaignError, fetchAllCampaigns, fetchPromotionRules } = useCampaign()
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Promotion rules state
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

  const handleFetchPromotionRules = async (campaignId: number) => {
    try {
      setPromotionRulesLoading(prev => ({ ...prev, [campaignId]: true }))
      
      const response = await fetchPromotionRules(campaignId)
      
      if (response && response.success && response.data) {
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
    return <CampaignDetailView params={{ id }} />
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
      {/* Search and Filter Bar */}
      <Card>
        <CardContent>
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

            {/* Refresh Button */}
            {/* <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={campaignLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${campaignLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button> */}

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
      <div className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
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
                <CardContent>
                  {/* Different layouts for list vs grid view */}
                  {viewMode === 'list' ? (
                    /* List View Layout */
                    <div className="flex gap-4 items-center">
                      {/* Icon Column */}
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      {/* Content Column */}
                      <div className="flex-1 flex flex-col gap-2">
                        {/* Row 1: Name, Date Created, Description */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 flex flex-col">
                            <div className="flex items-center gap-2 text-sm">
                              <CardTitle className="text-base">{campaign.name}</CardTitle>
                              <span className="text-muted-foreground">•</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(campaign.created_at || '').toLocaleDateString()}</span>
                              </div>
                            </div>
                            {campaign.description && (
                              <CardDescription className="text-sm max-w-full line-clamp-1 mt-1">{campaign.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="text-xs font-medium text-muted-foreground">
                              {campaign.promotion_rules_count} rule{campaign.promotion_rules_count !== 1 ? 's' : ''}
                            </div>
                            <Target className="h-4 w-4 text-chart-3" />
                          </div>
                        </div>

                        {/* Row 2: Dataset Info */}
                        {campaign.dataset && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Database className="h-4 w-4" />
                            <span>{campaign.dataset.name || `ID ${campaign.dataset.dataset_id}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Grid View Layout */
                    <div className="flex items-center gap-6">
                      {/* Icon on the left */}
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      {/* Vertical column of information */}
                      <div className="flex-1 flex flex-col gap-2">
                        {/* Name */}
                        <CardTitle className="text-base leading-tight">{campaign.name}</CardTitle>
                        
                        {/* Description */}
                        {campaign.description && (
                          <CardDescription className="text-sm line-clamp-2">{campaign.description}</CardDescription>
                        )}

                        {/* Dataset Info */}
                        {campaign.dataset && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Database className="h-4 w-4" />
                            <span>{campaign.dataset.name || `ID ${campaign.dataset.dataset_id}`}</span>
                          </div>
                        )}

                        {/* Rules count */}
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-chart-3" />
                          <div className="text-xs font-medium text-muted-foreground">
                            {campaign.promotion_rules_count} rule{campaign.promotion_rules_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(campaign.created_at || '').toLocaleDateString()}</span>
                        </div>

                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add Campaign Empty Card */}
            {/* {!debouncedSearchQuery.trim() && (
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
            )} */}

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
