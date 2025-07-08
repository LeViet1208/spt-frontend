"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDataset } from '@/hooks/useDataset'
import { useCampaign } from '@/hooks/useCampaign'
import type { Campaign } from '@/utils/types/campaign'
import type { Dataset } from '@/utils/types/dataset'
import {
  Database,
  Megaphone,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Plus,
  Calendar,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const router = useRouter()
  const { datasets, isLoading: datasetsLoading, fetchDatasets } = useDataset()
  const { allCampaigns: campaigns, isLoading: campaignsLoading, fetchAllCampaigns } = useCampaign()

  useEffect(() => {
    fetchDatasets()
    fetchAllCampaigns()
  }, [fetchDatasets, fetchAllCampaigns])

  // Calculate stats
  const completedDatasets = datasets.filter(d => d.status === 'completed').length
  const processingDatasets = datasets.filter(d => d.status === 'uploading' || d.status === 'analyzing').length
  const activeCampaigns = campaigns.filter(c => c.is_active).length
  const totalPromotionRules = campaigns.reduce((sum, c) => sum + c.promotion_rules_count, 0)

  const recentDatasets = datasets
    .filter(d => d.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 3)

  const recentCampaigns = campaigns
    .filter(c => c.created_at)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 3)

  // Helper function to get status display info
  const getStatusInfo = (dataset: Dataset) => {
    switch (dataset.status) {
      case 'completed':
        return { text: 'Ready', className: 'bg-green-50 text-green-700', clickable: true }
      case 'analyzing':
        return { text: 'Analyzing', className: 'bg-blue-50 text-blue-700', clickable: false }
      case 'uploading':
        return { text: 'Uploading', className: 'bg-yellow-50 text-yellow-700', clickable: false }
      case 'failed':
        return { text: 'Failed', className: 'bg-red-50 text-red-700', clickable: false }
      default:
        return { text: 'Unknown', className: 'bg-gray-50 text-gray-700', clickable: false }
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasets.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedDatasets} ready, {processingDatasets} processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready Datasets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedDatasets}</div>
            <p className="text-xs text-muted-foreground">
              Ready for insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCampaigns} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotion Rules</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPromotionRules}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datasets
            </CardTitle>
            <CardDescription>
              Manage your retail data and analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => router.push('/datasets')}
                variant="outline"
                className="w-full"
              >
                View All Datasets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => router.push('/datasets?view=add')}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Dataset
              </Button>
            </div>
            
            {recentDatasets.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Recent Datasets</h4>
                <div className="space-y-2">
                  {recentDatasets.map((dataset) => {
                    const statusInfo = getStatusInfo(dataset)
                    return (
                      <div 
                        key={dataset.id}
                        className={`flex items-center justify-between p-2 bg-muted/50 rounded ${statusInfo.clickable ? 'cursor-pointer hover:bg-muted' : 'cursor-default'}`}
                        onClick={() => statusInfo.clickable && router.push(`/datasets?id=${dataset.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dataset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(dataset.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={statusInfo.className}
                        >
                          {statusInfo.text}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campaigns
            </CardTitle>
            <CardDescription>
              Create and monitor promotional campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => router.push('/campaigns')}
                variant="outline"
                className="w-full"
              >
                View All Campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => router.push('/campaigns/new')}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Campaign
              </Button>
            </div>

            {recentCampaigns.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Recent Campaigns</h4>
                <div className="space-y-2">
                  {recentCampaigns.map((campaign) => (
                    <div 
                      key={campaign.campaign_id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted"
                      onClick={() => router.push(`/campaigns/${campaign.campaign_id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(campaign.created_at!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={campaign.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}
                      >
                        {campaign.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
