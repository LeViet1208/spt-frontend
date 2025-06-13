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

// Mock data for categories
const categories = [
  { id: "electronics", name: "Electronics" },
  { id: "clothing", name: "Clothing & Apparel" },
  { id: "grocery", name: "Grocery & Food" },
  { id: "home_garden", name: "Home & Garden" },
  { id: "sports", name: "Sports & Outdoors" },
  { id: "books", name: "Books & Media" },
  { id: "health", name: "Health & Beauty" },
]

// Mock category buy/not buy probability data generator
const generateMockCategoryData = (storeId: string): CategoryData[] => {
  const data: CategoryData[] = [];
  
  categories.forEach((category) => {
    // Generate buy probability based on store with some randomness
    const storeMultiplier = stores.findIndex(s => s.id === storeId) * 0.1 + 0.3; // 0.3 to 0.8
    const categoryMultiplier = categories.findIndex(c => c.id === category.id) * 0.05 + 0.4; // 0.4 to 0.75
    const baseProbability = 0.2 + (Math.random() * 0.6); // 0.2 to 0.8
    
    let buyProbability = baseProbability * storeMultiplier * categoryMultiplier;
    buyProbability = Math.min(buyProbability, 0.95); // Cap at 95%
    buyProbability = Math.max(buyProbability, 0.05); // Minimum 5%
    
    const notBuyProbability = 1 - buyProbability;
    
    data.push({
      category: category.name,
      buyProbability: parseFloat(buyProbability.toFixed(3)),
      notBuyProbability: parseFloat(notBuyProbability.toFixed(3))
    });
  });
  
  return data;
};

interface CategoryData {
  category: string;
  buyProbability: number;
  notBuyProbability: number;
}

export default function CategoryProbabilityDashboard() {
  const params = useParams();
  const datasetId = params.id as string;

  const [selectedStore, setSelectedStore] = useState("store_001")
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(false)

  // Generate mock data when store selection changes
  useEffect(() => {
    if (selectedStore) {
      setLoading(true)
      // Simulate API call delay
      setTimeout(() => {
        const mockData = generateMockCategoryData(selectedStore)
        setCategoryData(mockData)
        setLoading(false)
      }, 500)
    }
  }, [selectedStore])

  // Get selected store name for display
  const selectedStoreName = stores.find(s => s.id === selectedStore)?.name || ""

  // Calculate statistics from current data
  const stats = useMemo(() => {
    if (categoryData.length === 0) return null
    
    const buyProbabilities = categoryData.map(d => d.buyProbability)
    const avgBuyProbability = buyProbabilities.reduce((a, b) => a + b, 0) / buyProbabilities.length
    const maxBuyProbability = Math.max(...buyProbabilities)
    const minBuyProbability = Math.min(...buyProbabilities)
    
    const highBuyCount = buyProbabilities.filter(p => p >= 0.7).length
    const mediumBuyCount = buyProbabilities.filter(p => p >= 0.4 && p < 0.7).length
    const lowBuyCount = buyProbabilities.filter(p => p < 0.4).length
    
    return {
      total: categoryData.length,
      avgBuyProbability: parseFloat(avgBuyProbability.toFixed(3)),
      maxBuyProbability,
      minBuyProbability,
      highBuyCount,
      mediumBuyCount,
      lowBuyCount,
    }
  }, [categoryData])

  // Prepare pie chart data for overall buy vs not buy
  const overallPieData = useMemo(() => {
    if (categoryData.length === 0) return []
    
    const totalBuy = categoryData.reduce((sum, item) => sum + item.buyProbability, 0)
    const totalNotBuy = categoryData.reduce((sum, item) => sum + item.notBuyProbability, 0)
    const total = totalBuy + totalNotBuy
    
    return [
      { name: "Buy", value: parseFloat((totalBuy / total * 100).toFixed(1)) },
      { name: "Not Buy", value: parseFloat((totalNotBuy / total * 100).toFixed(1)) }
    ]
  }, [categoryData])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Category Purchase Probability Dashboard</h1>
          <p className="text-muted-foreground">Analyze buy/not buy probabilities by category for each store</p>
        </div>

        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Store Selection</CardTitle>
            <CardDescription>Choose a store to view category purchase probabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Store</label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected Store:</span>
                  <Badge variant="outline">{selectedStoreName}</Badge>
                  {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Categories</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.avgBuyProbability}</div>
                  <div className="text-sm text-muted-foreground">Avg Buy Probability</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.maxBuyProbability}</div>
                  <div className="text-sm text-muted-foreground">Highest Buy Probability</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.minBuyProbability}</div>
                  <div className="text-sm text-muted-foreground">Lowest Buy Probability</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Distribution Summary */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Buy Probability Distribution</CardTitle>
              <CardDescription>Breakdown of categories by buy probability ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">{stats.highBuyCount}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">High Buy Probability (≥0.7)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.mediumBuyCount}</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium Buy Probability (0.4-0.7)</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-xl font-bold text-red-700 dark:text-red-300">{stats.lowBuyCount}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Low Buy Probability (&lt;0.4)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Buy vs Not Buy Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Purchase Distribution</CardTitle>
              <CardDescription>
                Average buy vs not buy probability across all categories at {selectedStoreName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading chart...</div>
              ) : overallPieData.length > 0 ? (
                <Plot
                  data={[
                    {
                      values: overallPieData.map(d => d.value),
                      labels: overallPieData.map(d => d.name),
                      type: 'pie',
                      marker: {
                        colors: ['#10b981', '#ef4444'], // green for buy, red for not buy
                      },
                      hoverinfo: 'label+percent+name',
                      textinfo: 'percent',
                      insidetextorientation: 'radial',
                    },
                  ]}
                  layout={{
                    height: 300,
                    margin: { t: 20, b: 20, l: 20, r: 20 },
                    showlegend: true,
                    legend: {
                      orientation: 'h',
                      x: 0.5,
                      y: -0.1,
                      xanchor: 'center',
                      yanchor: 'top'
                    }
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="text-center p-4 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Category Buy Probabilities Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Buy Probabilities</CardTitle>
              <CardDescription>
                Buy probability for each category at {selectedStoreName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading chart...</div>
              ) : categoryData.length > 0 ? (
                <Plot
                  data={[
                    {
                      values: categoryData.map(d => d.buyProbability * 100),
                      labels: categoryData.map(d => d.category),
                      type: 'pie',
                      marker: {
                        colors: categoryData.map(d => {
                          if (d.buyProbability >= 0.7) return '#10b981'; // green
                          if (d.buyProbability >= 0.4) return '#f59e0b'; // yellow
                          return '#ef4444'; // red
                        }),
                      },
                      hovertemplate: '<b>%{label}</b><br>Buy Probability: %{value:.1f}%<extra></extra>',
                      textinfo: 'label+percent',
                      insidetextorientation: 'radial',
                    },
                  ]}
                  layout={{
                    height: 300,
                    margin: { t: 20, b: 20, l: 20, r: 20 },
                    showlegend: false,
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="text-center p-4 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Details Table */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Category Purchase Probabilities</CardTitle>
              <CardDescription>Detailed buy/not buy probabilities for all categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryData.sort((a, b) => b.buyProbability - a.buyProbability).map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Buy:</span>
                        <Badge 
                          variant={item.buyProbability >= 0.7 ? "default" : item.buyProbability >= 0.4 ? "secondary" : "destructive"}
                        >
                          {(item.buyProbability * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Not Buy:</span>
                        <Badge variant="outline">
                          {(item.notBuyProbability * 100).toFixed(1)}%
                        </Badge>
                      </div>
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
