"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from "react"
import { useParams } from 'next/navigation';

// Mock token for testing - easily editable
const MOCK_TOKEN = "fca1e6fa40adf6fe8062ee23afdc91885692f971";

// Dynamically import Plot with no SSR to avoid "self is not defined" error
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] flex items-center justify-center bg-muted rounded">Loading chart...</div>
});
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Mock data for stores
const stores = [
  { id: "store_001", name: "Downtown Plaza" },
  { id: "store_002", name: "Riverside Mall" },
  { id: "store_003", name: "Westside Center" },
  { id: "store_004", name: "North Point" },
  { id: "store_005", name: "Southgate" },
  { id: "store_006", name: "Eastside Market" },
]

// Mock data for SKUs
const skus = [
  { id: "SKU_001", name: "Premium Coffee Beans 1kg", brand: "Roaster's Choice" },
  { id: "SKU_002", name: "Organic Tea Collection", brand: "Nature's Blend" },
  { id: "SKU_003", name: "Dark Chocolate Bar 85%", brand: "Pure Cacao" },
  { id: "SKU_004", name: "Wireless Headphones Pro", brand: "SoundTech" },
  { id: "SKU_005", name: "Smart Fitness Tracker", brand: "HealthTech" },
  { id: "SKU_006", name: "Organic Pasta 500g", brand: "Farm Fresh" },
  { id: "SKU_007", name: "Greek Yogurt 4-Pack", brand: "Dairy Plus" },
  { id: "SKU_008", name: "Natural Body Lotion", brand: "Pure Care" },
]

// Mock data for weeks
const weeks = [
  { id: "2024_W01", name: "Week 1 (Jan 1-7)" },
  { id: "2024_W02", name: "Week 2 (Jan 8-14)" },
  { id: "2024_W03", name: "Week 3 (Jan 15-21)" },
  { id: "2024_W04", name: "Week 4 (Jan 22-28)" },
  { id: "2024_W05", name: "Week 5 (Jan 29-Feb 4)" },
  { id: "2024_W06", name: "Week 6 (Feb 5-11)" },
  { id: "2024_W07", name: "Week 7 (Feb 12-18)" },
  { id: "2024_W08", name: "Week 8 (Feb 19-25)" },
]

// Mock data for campaigns
const campaigns = [
  { id: "campaign_001", name: "Price Discount 20%" },
  { id: "campaign_002", name: "BOGO Offer" },
  { id: "campaign_003", name: "Bundle Deal" },
  { id: "campaign_004", name: "Loyalty Rewards 2x" },
  { id: "campaign_005", name: "Flash Sale 24hr" },
]

// Define the 18 effect categories
const effectCategories = [
  // Same Brand, Same Item
  { id: 'sb_si_pre_same', label: 'Same Brand, Same Item - Pre Week (Same Store)', category: 'Same Brand, Same Item', time: 'Pre Week', location: 'Same Store' },
  { id: 'sb_si_curr_same', label: 'Same Brand, Same Item - Current Week (Same Store)', category: 'Same Brand, Same Item', time: 'Current Week', location: 'Same Store' },
  { id: 'sb_si_post_same', label: 'Same Brand, Same Item - Post Week (Same Store)', category: 'Same Brand, Same Item', time: 'Post Week', location: 'Same Store' },
  { id: 'sb_si_pre_diff', label: 'Same Brand, Same Item - Pre Week (Different Store)', category: 'Same Brand, Same Item', time: 'Pre Week', location: 'Different Store' },
  { id: 'sb_si_curr_diff', label: 'Same Brand, Same Item - Current Week (Different Store)', category: 'Same Brand, Same Item', time: 'Current Week', location: 'Different Store' },
  { id: 'sb_si_post_diff', label: 'Same Brand, Same Item - Post Week (Different Store)', category: 'Same Brand, Same Item', time: 'Post Week', location: 'Different Store' },
  
  // Same Brand, Other Items
  { id: 'sb_oi_pre_same', label: 'Same Brand, Other Items - Pre Week (Same Store)', category: 'Same Brand, Other Items', time: 'Pre Week', location: 'Same Store' },
  { id: 'sb_oi_curr_same', label: 'Same Brand, Other Items - Current Week (Same Store)', category: 'Same Brand, Other Items', time: 'Current Week', location: 'Same Store' },
  { id: 'sb_oi_post_same', label: 'Same Brand, Other Items - Post Week (Same Store)', category: 'Same Brand, Other Items', time: 'Post Week', location: 'Same Store' },
  { id: 'sb_oi_pre_diff', label: 'Same Brand, Other Items - Pre Week (Different Store)', category: 'Same Brand, Other Items', time: 'Pre Week', location: 'Different Store' },
  { id: 'sb_oi_curr_diff', label: 'Same Brand, Other Items - Current Week (Different Store)', category: 'Same Brand, Other Items', time: 'Current Week', location: 'Different Store' },
  { id: 'sb_oi_post_diff', label: 'Same Brand, Other Items - Post Week (Different Store)', category: 'Same Brand, Other Items', time: 'Post Week', location: 'Different Store' },
  
  // Other Brands
  { id: 'ob_pre_same', label: 'Other Brands - Pre Week (Same Store)', category: 'Other Brands', time: 'Pre Week', location: 'Same Store' },
  { id: 'ob_curr_same', label: 'Other Brands - Current Week (Same Store)', category: 'Other Brands', time: 'Current Week', location: 'Same Store' },
  { id: 'ob_post_same', label: 'Other Brands - Post Week (Same Store)', category: 'Other Brands', time: 'Post Week', location: 'Same Store' },
  { id: 'ob_pre_diff', label: 'Other Brands - Pre Week (Different Store)', category: 'Other Brands', time: 'Pre Week', location: 'Different Store' },
  { id: 'ob_curr_diff', label: 'Other Brands - Current Week (Different Store)', category: 'Other Brands', time: 'Current Week', location: 'Different Store' },
  { id: 'ob_post_diff', label: 'Other Brands - Post Week (Different Store)', category: 'Other Brands', time: 'Post Week', location: 'Different Store' },
]

// Mock demand effects data generator
const generateMockDemandEffects = (skuId: string, storeId: string, weekId: string, campaignId: string): DemandEffect[] => {
  const data: DemandEffect[] = [];
  
  effectCategories.forEach((effect) => {
    // Generate effect based on category, time, and location
    let effectValue = 100; // Start with 100% baseline
    
    // Base effect varies by category
    if (effect.category === 'Same Brand, Same Item') {
      // Strongest effects for same brand, same item
      if (effect.time === 'Current Week') {
        effectValue += 20 + (Math.random() * 40); // +20% to +60%
      } else if (effect.time === 'Pre Week') {
        effectValue += -5 + (Math.random() * 15); // -5% to +10%
      } else { // Post Week
        effectValue += 5 + (Math.random() * 25); // +5% to +30%
      }
    } else if (effect.category === 'Same Brand, Other Items') {
      // Moderate positive effects
      if (effect.time === 'Current Week') {
        effectValue += 5 + (Math.random() * 20); // +5% to +25%
      } else if (effect.time === 'Pre Week') {
        effectValue += -2 + (Math.random() * 8); // -2% to +6%
      } else { // Post Week
        effectValue += 2 + (Math.random() * 12); // +2% to +14%
      }
    } else { // Other Brands
      // Usually negative or neutral effects (cannibalization)
      if (effect.time === 'Current Week') {
        effectValue += -15 + (Math.random() * 20); // -15% to +5%
      } else if (effect.time === 'Pre Week') {
        effectValue += -5 + (Math.random() * 10); // -5% to +5%
      } else { // Post Week
        effectValue += -8 + (Math.random() * 12); // -8% to +4%
      }
    }
    
    // Location modifier
    if (effect.location === 'Different Store') {
      effectValue *= 0.7; // Reduce effect for different stores
    }
    
    // Campaign type modifier
    const campaignMultiplier = campaigns.findIndex(c => c.id === campaignId) * 0.1 + 0.8; // 0.8 to 1.3
    effectValue *= campaignMultiplier;
    
    // Ensure reasonable bounds
    effectValue = Math.max(effectValue, 50); // Minimum 50%
    effectValue = Math.min(effectValue, 200); // Maximum 200%
    
    data.push({
      id: effect.id,
      label: effect.label,
      category: effect.category,
      time: effect.time,
      location: effect.location,
      effect: parseFloat(effectValue.toFixed(1)),
      change: parseFloat((effectValue - 100).toFixed(1))
    });
  });
  
  return data;
};

interface DemandEffect {
  id: string;
  label: string;
  category: string;
  time: string;
  location: string;
  effect: number;
  change: number;
}

export default function DemandEffectsDashboard() {
  const params = useParams();
  const datasetId = params.id as string;

  const [selectedSKU, setSelectedSKU] = useState("")
  const [selectedStore, setSelectedStore] = useState("")
  const [selectedWeek, setSelectedWeek] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState("")
  const [demandEffects, setDemandEffects] = useState<DemandEffect[]>([])
  const [loading, setLoading] = useState(false)

  // Check if all required selections are made
  const allSelectionsMade = selectedSKU && selectedStore && selectedWeek && selectedCampaign;

  // Generate mock data when all selections are made
  useEffect(() => {
    if (allSelectionsMade) {
      setLoading(true)
      // Simulate API call delay
      setTimeout(() => {
        const mockData = generateMockDemandEffects(selectedSKU, selectedStore, selectedWeek, selectedCampaign)
        setDemandEffects(mockData)
        setLoading(false)
      }, 800)
    } else {
      setDemandEffects([])
    }
  }, [selectedSKU, selectedStore, selectedWeek, selectedCampaign, allSelectionsMade])

  // Get selected names for display
  const selectedSKUName = skus.find(s => s.id === selectedSKU)?.name || ""
  const selectedStoreName = stores.find(s => s.id === selectedStore)?.name || ""
  const selectedWeekName = weeks.find(w => w.id === selectedWeek)?.name || ""
  const selectedCampaignName = campaigns.find(c => c.id === selectedCampaign)?.name || ""

  // Calculate statistics from current data
  const stats = useMemo(() => {
    if (demandEffects.length === 0) return null
    
    const changes = demandEffects.map(d => d.change)
    const positiveEffects = changes.filter(c => c > 0)
    const negativeEffects = changes.filter(c => c < 0)
    const strongPositive = changes.filter(c => c > 20).length
    const strongNegative = changes.filter(c => c < -10).length
    
    const maxIncrease = Math.max(...changes)
    const maxDecrease = Math.min(...changes)
    const avgEffect = changes.reduce((a, b) => a + b, 0) / changes.length
    
    return {
      totalEffects: demandEffects.length,
      positiveCount: positiveEffects.length,
      negativeCount: negativeEffects.length,
      strongPositive,
      strongNegative,
      maxIncrease: parseFloat(maxIncrease.toFixed(1)),
      maxDecrease: parseFloat(maxDecrease.toFixed(1)),
      avgEffect: parseFloat(avgEffect.toFixed(1)),
    }
  }, [demandEffects])

  // Prepare chart data grouped by category
  const chartData = useMemo(() => {
    if (demandEffects.length === 0) return { x: [], y: [], colors: [], labels: [] }
    
    // Sort effects by category, then by time, then by location
    const sortedEffects = [...demandEffects].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      if (a.time !== b.time) {
        const timeOrder = ['Pre Week', 'Current Week', 'Post Week']
        return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time)
      }
      return a.location.localeCompare(b.location)
    })
    
    return {
      x: sortedEffects.map(d => d.effect),
      y: sortedEffects.map(d => d.label),
      colors: sortedEffects.map(d => {
        if (d.change > 20) return '#10b981'; // Strong positive - green
        if (d.change > 0) return '#84cc16'; // Moderate positive - light green
        if (d.change > -10) return '#f59e0b'; // Small negative - yellow
        return '#ef4444'; // Strong negative - red
      }),
      labels: sortedEffects.map(d => `${d.effect}% (${d.change > 0 ? '+' : ''}${d.change}%)`)
    }
  }, [demandEffects])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Campaign Demand Effects Dashboard</h1>
          <p className="text-muted-foreground">Analyze hypothetical campaign effects on demand across different products, times, and locations</p>
        </div>

        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Parameters</CardTitle>
            <CardDescription>Select SKU, store, week, and campaign type to analyze demand effects (all selections required)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select SKU</label>
                <Select value={selectedSKU} onValueChange={setSelectedSKU}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose SKU..." />
                  </SelectTrigger>
                  <SelectContent>
                    {skus.map((sku) => (
                      <SelectItem key={sku.id} value={sku.id}>
                        {sku.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Store</label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Week</label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Week..." />
                  </SelectTrigger>
                  <SelectContent>
                    {weeks.map((week) => (
                      <SelectItem key={week.id} value={week.id}>
                        {week.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Campaign</label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Campaign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {allSelectionsMade && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-sm font-medium">Current Selection:</span>
                <Badge variant="outline">{selectedSKUName}</Badge>
                <Badge variant="outline">{selectedStoreName}</Badge>
                <Badge variant="outline">{selectedWeekName}</Badge>
                <Badge variant="outline">{selectedCampaignName}</Badge>
                {loading && <span className="text-sm text-muted-foreground">Loading effects...</span>}
              </div>
            )}
            
            {!allSelectionsMade && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please select all parameters above to view demand effects analysis.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalEffects}</div>
                  <div className="text-sm text-muted-foreground">Total Effects</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.positiveCount}</div>
                  <div className="text-sm text-muted-foreground">Positive Effects</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.negativeCount}</div>
                  <div className="text-sm text-muted-foreground">Negative Effects</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.avgEffect > 0 ? '+' : ''}{stats.avgEffect}%</div>
                  <div className="text-sm text-muted-foreground">Average Effect</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Effect Distribution Summary */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Effect Distribution</CardTitle>
              <CardDescription>Breakdown of campaign effects by impact strength</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">{stats.strongPositive}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Strong Positive (&gt;+20%)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.positiveCount - stats.strongPositive}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Moderate Positive (0-20%)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.negativeCount - stats.strongNegative}</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Moderate Negative (0 to -10%)</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-xl font-bold text-red-700 dark:text-red-300">{stats.strongNegative}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Strong Negative (&lt;-10%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demand Effects Chart */}
        {allSelectionsMade && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Demand Effects (18 Categories)</CardTitle>
              <CardDescription>
                Horizontal bar chart showing demand effects relative to 100% baseline for {selectedCampaignName} on {selectedSKUName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading demand effects...</div>
              ) : demandEffects.length > 0 ? (
                <Plot
                  data={[
                    {
                      x: chartData.x,
                      y: chartData.y,
                      type: 'bar',
                      orientation: 'h',
                      marker: {
                        color: chartData.colors,
                      },
                      hovertemplate: '<b>%{y}</b><br>Effect: %{text}<extra></extra>',
                      text: chartData.labels,
                    },
                  ]}
                  layout={{
                    height: 800,
                    xaxis: {
                      title: { text: "Demand Effect (%)" },
                      range: [0, Math.max(200, Math.max(...chartData.x) + 20)],
                      showgrid: true,
                      zeroline: false,
                    },
                    yaxis: {
                      title: { text: "" },
                      automargin: true,
                      tickfont: { size: 10 },
                    },
                    margin: { t: 20, b: 60, l: 400, r: 60 },
                    shapes: [
                      {
                        type: 'line',
                        x0: 100,
                        x1: 100,
                        y0: -0.5,
                        y1: demandEffects.length - 0.5,
                        line: {
                          color: '#6b7280',
                          width: 2,
                          dash: 'dash',
                        },
                      },
                    ],
                    annotations: [
                      {
                        x: 100,
                        y: demandEffects.length,
                        text: "100% Baseline",
                        showarrow: false,
                        xanchor: 'center',
                        yanchor: 'bottom',
                        font: { size: 12, color: '#6b7280' },
                      },
                    ],
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="text-center p-4 text-muted-foreground">No effects data available</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Effects Details Table */}
        {demandEffects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Effects Breakdown</CardTitle>
              <CardDescription>Complete breakdown of all 18 demand effects by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Same Brand, Same Item', 'Same Brand, Other Items', 'Other Brands'].map((category) => (
                  <div key={category}>
                    <h4 className="font-semibold mb-2">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {demandEffects
                        .filter(effect => effect.category === category)
                        .map((effect) => (
                          <div key={effect.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{effect.time}</div>
                              <div className="text-xs text-muted-foreground">{effect.location}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  effect.change > 20 ? "default" : 
                                  effect.change > 0 ? "secondary" : 
                                  effect.change > -10 ? "outline" : "destructive"
                                }
                              >
                                {effect.effect}%
                              </Badge>
                              <span className={`text-sm ${effect.change > 0 ? 'text-green-600' : effect.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                ({effect.change > 0 ? '+' : ''}{effect.change}%)
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
