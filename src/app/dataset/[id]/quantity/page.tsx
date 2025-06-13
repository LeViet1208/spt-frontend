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

// Mock quantity probability data generator
const generateMockQuantityData = (): QuantityData[] => {
  const data: QuantityData[] = [];
  
  // Generate probabilities for purchasing 1-20 items
  const maxQuantity = 20;
  let totalProbability = 0;
  
  for (let quantity = 1; quantity <= maxQuantity; quantity++) {
    // Higher probability for smaller quantities (typical purchasing behavior)
    let probability;
    if (quantity === 1) {
      probability = 0.25 + Math.random() * 0.15; // 25-40%
    } else if (quantity <= 3) {
      probability = 0.15 + Math.random() * 0.1; // 15-25%
    } else if (quantity <= 5) {
      probability = 0.08 + Math.random() * 0.07; // 8-15%
    } else if (quantity <= 10) {
      probability = 0.03 + Math.random() * 0.05; // 3-8%
    } else {
      probability = 0.005 + Math.random() * 0.025; // 0.5-3%
    }
    
    totalProbability += probability;
    
    data.push({
      quantity,
      probability: parseFloat(probability.toFixed(4)),
      percentage: 0 // Will be calculated after normalization
    });
  }
  
  // Normalize probabilities to sum to 1
  data.forEach(item => {
    item.probability = item.probability / totalProbability;
    item.percentage = parseFloat((item.probability * 100).toFixed(2));
  });
  
  return data.sort((a, b) => b.probability - a.probability);
};

interface QuantityData {
  quantity: number;
  probability: number;
  percentage: number;
}

export default function QuantityProbabilityDashboard() {
  const params = useParams();
  const datasetId = params.id as string;

  const [quantityData, setQuantityData] = useState<QuantityData[]>([])
  const [loading, setLoading] = useState(false)

  // Generate mock data on component mount
  useEffect(() => {
    setLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      const mockData = generateMockQuantityData()
      setQuantityData(mockData)
      setLoading(false)
    }, 500)
  }, [])

  // Calculate statistics from current data
  const stats = useMemo(() => {
    if (quantityData.length === 0) return null
    
    // Sort by quantity for proper order
    const sortedData = [...quantityData].sort((a, b) => a.quantity - b.quantity);
    
    // Calculate weighted average (expected value)
    const expectedQuantity = sortedData.reduce((sum, item) => sum + (item.quantity * item.probability), 0);
    
    // Find mode (most likely quantity)
    const mode = quantityData.reduce((prev, current) => 
      prev.probability > current.probability ? prev : current
    );
    
    // Calculate cumulative probabilities for insights
    let cumulative = 0;
    const cumulative5 = sortedData.slice(0, 5).reduce((sum, item) => sum + item.probability, 0);
    const cumulative10 = sortedData.slice(0, 10).reduce((sum, item) => sum + item.probability, 0);
    
    // Count high probability quantities (>5%)
    const highProbQuantities = quantityData.filter(item => item.percentage > 5);
    
    return {
      totalQuantities: quantityData.length,
      expectedQuantity: parseFloat(expectedQuantity.toFixed(2)),
      mode: mode.quantity,
      modePercentage: mode.percentage,
      cumulative5Items: parseFloat((cumulative5 * 100).toFixed(1)),
      cumulative10Items: parseFloat((cumulative10 * 100).toFixed(1)),
      highProbCount: highProbQuantities.length,
    }
  }, [quantityData])

  // Prepare histogram data sorted by quantity
  const histogramData = useMemo(() => {
    return [...quantityData].sort((a, b) => a.quantity - b.quantity);
  }, [quantityData])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Purchase Quantity Probability Dashboard</h1>
          <p className="text-muted-foreground">Analyze the probability distribution of units purchased per transaction</p>
        </div>

        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.expectedQuantity}</div>
                  <div className="text-sm text-muted-foreground">Expected Quantity</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.mode}</div>
                  <div className="text-sm text-muted-foreground">Most Likely Quantity</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.modePercentage}%</div>
                  <div className="text-sm text-muted-foreground">Mode Probability</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.cumulative5Items}%</div>
                  <div className="text-sm text-muted-foreground">Buy ≤5 Items</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Key Insights */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Behavior Insights</CardTitle>
              <CardDescription>Key patterns in customer purchasing quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.cumulative5Items}%</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Buy 1-5 Items</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">{stats.cumulative10Items}%</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Buy 1-10 Items</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{stats.highProbCount}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">High Probability Quantities (&gt;5%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quantity Probability Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Quantity Probability Distribution</CardTitle>
            <CardDescription>
              Probability of purchasing different quantities of items per transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center p-4">Loading histogram...</div>
            ) : histogramData.length > 0 ? (
              <Plot
                data={[
                  {
                    x: histogramData.map(d => d.quantity),
                    y: histogramData.map(d => d.percentage),
                    type: 'bar',
                    marker: {
                      color: histogramData.map(d => {
                        if (d.percentage >= 15) return '#3b82f6'; // blue for very high
                        if (d.percentage >= 10) return '#10b981'; // green for high
                        if (d.percentage >= 5) return '#f59e0b'; // yellow for medium
                        return '#6b7280'; // gray for low
                      }),
                    },
                    hovertemplate: '<b>%{x} items</b><br>Probability: %{y:.2f}%<extra></extra>',
                  },
                ]}
                layout={{
                  height: 400,
                  xaxis: {
                    title: { text: "Number of Items Purchased" },
                    tickmode: 'linear',
                    tick0: 1,
                    dtick: 1,
                  },
                  yaxis: {
                    title: { text: "Probability (%)" },
                  },
                  margin: { t: 20, b: 60, l: 60, r: 20 },
                }}
                config={{ responsive: true }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="text-center p-4 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Quantities Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Purchase Quantities</CardTitle>
              <CardDescription>Distribution of most common purchase quantities</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading chart...</div>
              ) : quantityData.length > 0 ? (
                <Plot
                  data={[
                    {
                      values: quantityData.slice(0, 8).map(d => d.percentage), // Top 8 quantities
                      labels: quantityData.slice(0, 8).map(d => `${d.quantity} item${d.quantity > 1 ? 's' : ''}`),
                      type: 'pie',
                      marker: {
                        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
                      },
                      hovertemplate: '<b>%{label}</b><br>Probability: %{value:.2f}%<extra></extra>',
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

          {/* Cumulative Probability */}
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Probability</CardTitle>
              <CardDescription>Probability of purchasing up to N items</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading chart...</div>
              ) : histogramData.length > 0 ? (
                <Plot
                  data={[
                    {
                      x: histogramData.slice(0, 15).map(d => d.quantity), // Show first 15 for clarity
                      y: histogramData.slice(0, 15).reduce((acc, curr, index) => {
                        const cumulative = index === 0 ? curr.percentage : acc[index - 1] + curr.percentage;
                        acc.push(cumulative);
                        return acc;
                      }, [] as number[]),
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#3b82f6', width: 3 },
                      marker: { color: '#3b82f6', size: 6 },
                      hovertemplate: '<b>≤%{x} items</b><br>Cumulative: %{y:.1f}%<extra></extra>',
                    },
                  ]}
                  layout={{
                    height: 300,
                    xaxis: {
                      title: { text: "Number of Items" },
                      tickmode: 'linear',
                      tick0: 1,
                      dtick: 1,
                    },
                    yaxis: {
                      title: { text: "Cumulative Probability (%)" },
                      range: [0, 100],
                    },
                    margin: { t: 20, b: 60, l: 60, r: 20 },
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

        {/* Detailed Quantity Table */}
        {quantityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Quantity Probabilities</CardTitle>
              <CardDescription>Complete breakdown of purchase quantity probabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...quantityData].sort((a, b) => a.quantity - b.quantity).map((item) => (
                  <div key={item.quantity} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.quantity} item{item.quantity > 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          item.percentage >= 15 ? "default" : 
                          item.percentage >= 10 ? "secondary" : 
                          item.percentage >= 5 ? "outline" : "destructive"
                        }
                      >
                        {item.percentage}%
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
