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

// Mock store performance data generator
const generateMockStoreData = (): StoreData[] => {
  const data: StoreData[] = [];
  
  stores.forEach((store, index) => {
    // Generate performance metrics with some variation
    const basePerformance = 0.4 + (Math.random() * 0.5); // 0.4 to 0.9
    const locationMultiplier = (6 - index) * 0.05 + 0.7; // 0.95 to 0.7 (downtown better)
    const seasonalFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    
    let salesProbability = basePerformance * locationMultiplier * seasonalFactor;
    salesProbability = Math.min(salesProbability, 0.95); // Cap at 95%
    salesProbability = Math.max(salesProbability, 0.15); // Minimum 15%
    
    const customerSatisfaction = 0.6 + (Math.random() * 0.35); // 0.6 to 0.95
    const footTraffic = 100 + Math.floor(Math.random() * 400); // 100 to 500
    const avgTransactionValue = 25 + Math.floor(Math.random() * 75); // $25 to $100
    
    data.push({
      storeId: store.id,
      storeName: store.name,
      salesProbability: parseFloat(salesProbability.toFixed(3)),
      customerSatisfaction: parseFloat(customerSatisfaction.toFixed(3)),
      footTraffic,
      avgTransactionValue,
      performanceScore: parseFloat(((salesProbability + customerSatisfaction) / 2).toFixed(3))
    });
  });
  
  return data.sort((a, b) => b.performanceScore - a.performanceScore);
};

interface StoreData {
  storeId: string;
  storeName: string;
  salesProbability: number;
  customerSatisfaction: number;
  footTraffic: number;
  avgTransactionValue: number;
  performanceScore: number;
}

export default function StorePerformanceDashboard() {
  const params = useParams();
  const datasetId = params.id as string;

  const [storeData, setStoreData] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(false)

  // Generate mock data on component mount
  useEffect(() => {
    setLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      const mockData = generateMockStoreData()
      setStoreData(mockData)
      setLoading(false)
    }, 500)
  }, [])

  // Calculate statistics from current data
  const stats = useMemo(() => {
    if (storeData.length === 0) return null
    
    const salesProbabilities = storeData.map(d => d.salesProbability)
    const satisfactionScores = storeData.map(d => d.customerSatisfaction)
    const footTrafficValues = storeData.map(d => d.footTraffic)
    const transactionValues = storeData.map(d => d.avgTransactionValue)
    
    const avgSalesProbability = salesProbabilities.reduce((a, b) => a + b, 0) / salesProbabilities.length
    const avgSatisfaction = satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
    const totalFootTraffic = footTrafficValues.reduce((a, b) => a + b, 0)
    const avgTransactionValue = transactionValues.reduce((a, b) => a + b, 0) / transactionValues.length
    
    const topPerformer = storeData[0]
    const lowPerformer = storeData[storeData.length - 1]
    
    return {
      totalStores: storeData.length,
      avgSalesProbability: parseFloat(avgSalesProbability.toFixed(3)),
      avgSatisfaction: parseFloat(avgSatisfaction.toFixed(3)),
      totalFootTraffic,
      avgTransactionValue: Math.round(avgTransactionValue),
      topPerformer,
      lowPerformer,
    }
  }, [storeData])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Store Performance Dashboard</h1>
          <p className="text-muted-foreground">Analyze performance metrics across all stores</p>
        </div>

        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalStores}</div>
                  <div className="text-sm text-muted-foreground">Total Stores</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{(stats.avgSalesProbability * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Sales Probability</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{(stats.avgSatisfaction * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Customer Satisfaction</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">${stats.avgTransactionValue}</div>
                  <div className="text-sm text-muted-foreground">Avg Transaction Value</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top and Bottom Performers */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performer</CardTitle>
                <CardDescription>Best performing store based on overall metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">{stats.topPerformer.storeName}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Performance Score: {(stats.topPerformer.performanceScore * 100).toFixed(1)}%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{(stats.topPerformer.salesProbability * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Sales Probability</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{(stats.topPerformer.customerSatisfaction * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Satisfaction</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{stats.topPerformer.footTraffic}</div>
                      <div className="text-xs text-muted-foreground">Daily Traffic</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">${stats.topPerformer.avgTransactionValue}</div>
                      <div className="text-xs text-muted-foreground">Avg Transaction</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Needs Improvement</CardTitle>
                <CardDescription>Store with lowest performance requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-lg font-bold text-red-700 dark:text-red-300">{stats.lowPerformer.storeName}</div>
                    <div className="text-sm text-red-600 dark:text-red-400">Performance Score: {(stats.lowPerformer.performanceScore * 100).toFixed(1)}%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{(stats.lowPerformer.salesProbability * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Sales Probability</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{(stats.lowPerformer.customerSatisfaction * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Satisfaction</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{stats.lowPerformer.footTraffic}</div>
                      <div className="text-xs text-muted-foreground">Daily Traffic</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">${stats.lowPerformer.avgTransactionValue}</div>
                      <div className="text-xs text-muted-foreground">Avg Transaction</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Store Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Probability by Store */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Probability by Store</CardTitle>
              <CardDescription>Sales probability comparison across all stores</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading chart...</div>
              ) : storeData.length > 0 ? (
                <Plot
                  data={[
                    {
                      x: storeData.map(d => d.storeName),
                      y: storeData.map(d => d.salesProbability * 100),
                      type: 'bar',
                      marker: {
                        color: storeData.map(d => {
                          if (d.salesProbability >= 0.7) return '#10b981'; // green
                          if (d.salesProbability >= 0.5) return '#f59e0b'; // yellow
                          return '#ef4444'; // red
                        }),
                      },
                      hovertemplate: '<b>%{x}</b><br>Sales Probability: %{y:.1f}%<extra></extra>',
                    },
                  ]}
                  layout={{
                    height: 300,
                    xaxis: {
                      title: { text: "Store" },
                      automargin: true,
                      tickangle: -45,
                    },
                    yaxis: {
                      title: { text: "Sales Probability (%)" },
                      range: [0, 100],
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

          {/* Customer Satisfaction by Store */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction by Store</CardTitle>
              <CardDescription>Customer satisfaction scores across all stores</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading chart...</div>
              ) : storeData.length > 0 ? (
                <Plot
                  data={[
                    {
                      x: storeData.map(d => d.storeName),
                      y: storeData.map(d => d.customerSatisfaction * 100),
                      type: 'bar',
                      marker: {
                        color: storeData.map(d => {
                          if (d.customerSatisfaction >= 0.8) return '#10b981'; // green
                          if (d.customerSatisfaction >= 0.6) return '#f59e0b'; // yellow
                          return '#ef4444'; // red
                        }),
                      },
                      hovertemplate: '<b>%{x}</b><br>Satisfaction: %{y:.1f}%<extra></extra>',
                    },
                  ]}
                  layout={{
                    height: 300,
                    xaxis: {
                      title: { text: "Store" },
                      automargin: true,
                      tickangle: -45,
                    },
                    yaxis: {
                      title: { text: "Customer Satisfaction (%)" },
                      range: [0, 100],
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
        </div>

        {/* Store Performance Table */}
        {storeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Store Performance Rankings</CardTitle>
              <CardDescription>Comprehensive performance metrics for all stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {storeData.map((store, index) => (
                  <div key={store.storeId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{store.storeName}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{(store.salesProbability * 100).toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Sales Prob.</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{(store.customerSatisfaction * 100).toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Satisfaction</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{store.footTraffic}</div>
                        <div className="text-xs text-muted-foreground">Daily Traffic</div>
                      </div>
                      <div className="text-center">
                        <Badge 
                          variant={store.performanceScore >= 0.7 ? "default" : store.performanceScore >= 0.5 ? "secondary" : "destructive"}
                        >
                          {(store.performanceScore * 100).toFixed(1)}%
                        </Badge>
                        <div className="text-xs text-muted-foreground">Performance</div>
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
