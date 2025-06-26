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

// Mock SKU probability data generator
const generateMockSKUData = (storeId: string, categoryId: string) => {
  const skuCount = 25 + Math.floor(Math.random() * 25); // 25-50 SKUs
  const data = [];
  
  for (let i = 1; i <= skuCount; i++) {
    const skuId = `SKU_${categoryId.toUpperCase()}_${String(i).padStart(3, '0')}`;
    // Generate probability based on store and category with some randomness
    const baseProbability = 0.1 + (Math.random() * 0.8); // 0.1 to 0.9
    const storeMultiplier = stores.findIndex(s => s.id === storeId) * 0.05 + 0.8; // 0.8 to 1.05
    const categoryMultiplier = categories.findIndex(c => c.id === categoryId) * 0.03 + 0.9; // 0.9 to 1.08
    
    let probability = baseProbability * storeMultiplier * categoryMultiplier;
    probability = Math.min(probability, 1.0); // Cap at 1.0
    probability = Math.max(probability, 0.01); // Minimum 0.01
    
    data.push({
      sku: skuId,
      probability: parseFloat(probability.toFixed(3))
    });
  }
  
  return data.sort((a, b) => b.probability - a.probability);
};

interface SKUData {
  sku: string;
  probability: number;
}

export default function SKUProbabilityDashboard() {
  const params = useParams();
  const datasetId = params.id as string;

  const [selectedStore, setSelectedStore] = useState("store_001")
  const [selectedCategory, setSelectedCategory] = useState("electronics")
  const [skuData, setSKUData] = useState<SKUData[]>([])
  const [loading, setLoading] = useState(false)

  // Generate mock data when selections change
  useEffect(() => {
    if (selectedStore && selectedCategory) {
      setLoading(true)
      // Simulate API call delay
      setTimeout(() => {
        const mockData = generateMockSKUData(selectedStore, selectedCategory)
        setSKUData(mockData)
        setLoading(false)
      }, 500)
    }
  }, [selectedStore, selectedCategory])

  // Get selected store and category names for display
  const selectedStoreName = stores.find(s => s.id === selectedStore)?.name || ""
  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || ""

  // Calculate statistics from current data
  const stats = useMemo(() => {
    if (skuData.length === 0) return null
    
    const probabilities = skuData.map(d => d.probability)
    const sum = probabilities.reduce((a, b) => a + b, 0)
    const mean = sum / probabilities.length
    const sorted = [...probabilities].sort((a, b) => a - b)
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
    const max = Math.max(...probabilities)
    const min = Math.min(...probabilities)
    
    return {
      total: skuData.length,
      mean: parseFloat(mean.toFixed(3)),
      median: parseFloat(median.toFixed(3)),
      max,
      min,
      highProbCount: probabilities.filter(p => p >= 0.7).length,
      mediumProbCount: probabilities.filter(p => p >= 0.4 && p < 0.7).length,
      lowProbCount: probabilities.filter(p => p < 0.4).length,
    }
  }, [skuData])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">SKU Probability Dashboard</h1>
          <p className="text-muted-foreground">Analyze SKU probabilities by store and category</p>
        </div>

        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Selection</CardTitle>
            <CardDescription>Choose a store and category to view SKU probability distribution</CardDescription>
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
              <div>
                <label className="text-sm font-medium mb-2 block">Select Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm font-medium">Current Selection:</span>
              <Badge variant="outline">{selectedStoreName}</Badge>
              <Badge variant="outline">{selectedCategoryName}</Badge>
              {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
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
                  <div className="text-sm text-muted-foreground">Total SKUs</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.mean}</div>
                  <div className="text-sm text-muted-foreground">Average Probability</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.max}</div>
                  <div className="text-sm text-muted-foreground">Highest Probability</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.median}</div>
                  <div className="text-sm text-muted-foreground">Median Probability</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Probability Distribution Summary */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Probability Distribution</CardTitle>
              <CardDescription>Breakdown of SKUs by probability ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">{stats.highProbCount}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">High Probability (≥0.7)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.mediumProbCount}</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium Probability (0.4-0.7)</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-xl font-bold text-red-700 dark:text-red-300">{stats.lowProbCount}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Low Probability (&lt;0.4)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SKU Probability Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>SKU Probability Histogram</CardTitle>
            <CardDescription>
              Distribution of probability values for all SKUs in {selectedCategoryName} at {selectedStoreName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center p-4">Loading histogram...</div>
            ) : skuData.length > 0 ? (
              <Plot
                data={[
                  {
                    x: skuData.map(d => d.sku),
                    y: skuData.map(d => d.probability),
                    type: 'bar',
                    marker: {
                      color: skuData.map(d => {
                        if (d.probability >= 0.7) return '#10b981'; // green
                        if (d.probability >= 0.4) return '#f59e0b'; // yellow
                        return '#ef4444'; // red
                      }),
                    },
                    hovertemplate: '<b>%{x}</b><br>Probability: %{y}<extra></extra>',
                  },
                ]}
                layout={{
                  height: 400,
                  xaxis: {
                    title: { text: "SKU ID" },
                    automargin: true,
                    tickangle: -45,
                  },
                  yaxis: {
                    title: { text: "Probability" },
                    range: [0, 1],
                  },
                  margin: { t: 20, b: 100, l: 60, r: 20 },
                }}
                config={{ responsive: true }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="text-center p-4 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Top SKUs Table */}
        {skuData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 SKUs by Probability</CardTitle>
              <CardDescription>Highest probability SKUs for the selected store and category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {skuData.slice(0, 10).map((item, index) => (
                  <div key={item.sku} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{item.sku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={item.probability >= 0.7 ? "default" : item.probability >= 0.4 ? "secondary" : "destructive"}
                      >
                        {(item.probability * 100).toFixed(1)}%
                      </Badge>
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
