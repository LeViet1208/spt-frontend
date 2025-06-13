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

// Child table options
const childTables = [
  { key: "transactions", label: "Transactions" },
  { key: "productlookups", label: "Product Lookups" },
  { key: "causallookups", label: "Causal Lookups" },
]

// Sample variables for each child table
const variablesByTable: { [key: string]: { key: string; label: string; type: string }[] } = {
  transactions: [
    { key: "upc", label: "UPC", type: "categorical" },
    { key: "dollar_sales", label: "Dollar Sales", type: "numerical" },
    { key: "units", label: "Unit Sales", type: "numerical" },
    { key: "time_of_transaction", label: "Time of Transaction", type: "categorical" },
    { key: "day", label: "Day", type: "categorical" },
    { key: "week", label: "Week", type: "categorical" },
    { key: "store", label: "Store", type: "categorical" },
    { key: "geography", label: "Geography", type: "categorical" },
    { key: "basket", label: "Basket", type: "categorical" },
    { key: "household", label: "Household", type: "categorical" },
    { key: "coupon", label: "Coupon", type: "categorical" },
  ],
  productlookups: [
    { key: "upc", label: "UPC", type: "categorical" },
    { key: "product_description", label: "Product Description", type: "categorical" },
    { key: "commodity", label: "Commodity", type: "categorical" },
    { key: "brand", label: "Brand", type: "categorical" },
    { key: "product_size", label: "Product Size", type: "numerical" },
  ],
  causallookups: [
    { key: "upc", label: "UPC", type: "categorical" },
    { key: "week", label: "Week", type: "categorical" },
    { key: "store", label: "Store", type: "categorical" },
    { key: "geography", label: "Geography", type: "categorical" },
    { key: "feature_desc", label: "Feature", type: "categorical" },
    { key: "display_desc", label: "Display", type: "categorical" },
  ],
}

const chartColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff"]

// Types for API responses
interface NumericalStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  std: number;
  mode: number[];
  count: number;
  unique: number;
  bins: { [key: string]: number };
}

interface CategoricalStats {
  count: number;
  unique: number;
  bins: { [key: string]: number };
}

type VariableStats = NumericalStats | CategoricalStats;

export default function StatsDashboard() {
  const params = useParams();
  const datasetId = params.id as string;

  const [selectedTable, setSelectedTable] = useState("transactions")
  const [selectedVariable, setSelectedVariable] = useState("week")
  const [variableStats, setVariableStats] = useState<VariableStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableVariables = variablesByTable[selectedTable] || []
  const selectedColumn = availableVariables.find((col) => col.key === selectedVariable)
  const isNumerical = selectedColumn?.type === "numerical"

  // Fetch variable statistics from API
  const fetchVariableStats = async (table: string, variable: string) => {
    if (!datasetId || !table || !variable) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:8000/datasets/${datasetId}/${table}/${variable}`, {
        headers: {
          'Authorization': `Token ${MOCK_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      const data = await response.json()
      setVariableStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setVariableStats(null)
    } finally {
      setLoading(false)
    }
  }

  // Effect to reset variable when table changes
  useEffect(() => {
    const newVariables = variablesByTable[selectedTable]
    if (newVariables && newVariables.length > 0) {
      setSelectedVariable(newVariables[0].key)
    }
  }, [selectedTable])

  // Effect to fetch data when selections change - only after variable is properly set
  useEffect(() => {
    const availableVars = variablesByTable[selectedTable]
    const isValidVariable = availableVars?.some(v => v.key === selectedVariable)
    
    // Only fetch if the current variable is valid for the current table
    if (isValidVariable) {
      fetchVariableStats(selectedTable, selectedVariable)
    }
  }, [selectedTable, selectedVariable, datasetId])

  // Process API data for display
  const processedStats = useMemo(() => {
    if (!variableStats) return null

    if (isNumerical) {
      const stats = variableStats as NumericalStats
      return {
        type: 'numerical' as const,
        mean: stats.mean ?? 0,
        median: stats.median ?? 0,
        mode: (stats.mode && Array.isArray(stats.mode) && stats.mode.length > 0) ? stats.mode[0] : 'N/A',
        min: stats.min ?? 0,
        max: stats.max ?? 0,
        q1: stats.q1 ?? 0,
        q3: stats.q3 ?? 0,
        std: stats.std ?? 0,
        count: stats.count ?? 0,
        unique: stats.unique ?? 0,
        bins: stats.bins ?? {}
      }
    } else {
      const stats = variableStats as CategoricalStats
      const bins = stats.bins ?? {}
      const sortedBins = Object.entries(bins).sort(([, a], [, b]) => b - a)
      const mode = sortedBins[0]?.[0] || 'N/A'

      // Process pie data - show top 10 and group rest as "Others"
      const sortedEntries = Object.entries(bins).sort(([, a], [, b]) => b - a)
      const top10 = sortedEntries.slice(0, 10)
      const remaining = sortedEntries.slice(10)
      
      let pieData = top10.map(([key, value]) => ({ name: key, value }))
      
      // Add "Others" category if there are more than 10 items
      if (remaining.length > 0) {
        const othersValue = remaining.reduce((sum, [, value]) => sum + value, 0)
        pieData.push({ name: "Others", value: othersValue })
      }

      return {
        type: 'categorical' as const,
        mode,
        frequency: bins,
        count: stats.count ?? 0,
        unique: stats.unique ?? 0,
        pieData
      }
    }
  }, [variableStats, isNumerical])

  // Prepare histogram data from API
  const histogramData = useMemo(() => {
    if (!processedStats) return []

    if (processedStats.type === 'numerical') {
      // For numerical data, show top bins from API response
      return Object.entries(processedStats.bins)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // Show top 10 bins
        .map(([value, count]) => ({ value: parseFloat(value), count }))
    } else {
      // For categorical data, show all categories
      return Object.entries(processedStats.frequency).map(([category, count]) => ({
        category,
        count
      }))
    }
  }, [processedStats])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Dataset Statistics Dashboard</h1>
          <p className="text-muted-foreground">Explore descriptive statistics and visualizations for your dataset</p>
        </div>

        {/* Variable Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Variable Selection</CardTitle>
            <CardDescription>Choose a child table and variable to analyze its descriptive statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Child Table</label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {childTables.map((table) => (
                      <SelectItem key={table.key} value={table.key}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Variable</label>
                <Select value={selectedVariable} onValueChange={setSelectedVariable}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVariables.map((col) => (
                      <SelectItem key={col.key} value={col.key}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm font-medium">Type:</span>
              <Badge variant={isNumerical ? "default" : "secondary"}>{selectedColumn?.type}</Badge>
              {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
              {error && <span className="text-sm text-red-500">{error}</span>}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Descriptive Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Descriptive Statistics</CardTitle>
              <CardDescription>
                {isNumerical ? "Numerical" : "Categorical"} statistics for {selectedColumn?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading statistics...</div>
              ) : error ? (
                <div className="text-center p-4 text-red-500">{error}</div>
              ) : processedStats ? (
                processedStats.type === 'numerical' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Mean:</span>
                        <span>{processedStats.mean.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Median:</span>
                        <span>{processedStats.median.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Mode:</span>
                        <span>{processedStats.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Minimum:</span>
                        <span>{processedStats.min}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Maximum:</span>
                        <span>{processedStats.max}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Q1:</span>
                        <span>{processedStats.q1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Q3:</span>
                        <span>{processedStats.q3}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Std Dev:</span>
                        <span>{processedStats.std.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Mode:</span>
                      <Badge>{processedStats.mode}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Count:</span>
                      <span>{processedStats.count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Unique Values:</span>
                      <span>{processedStats.unique}</span>
                    </div>
                    <div className="space-y-2">
                      <span className="font-medium">Top Frequencies:</span>
                      {Object.entries(processedStats.frequency)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span>{key}:</span>
                            <span>{value.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center p-4 text-muted-foreground">Select a variable to view statistics</div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart for Categorical or Summary for Numerical */}
          {processedStats && processedStats.type === 'categorical' ? (
            <Card>
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
                <CardDescription>Pie chart showing the distribution of {selectedColumn?.label}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center p-4">Loading chart...</div>
                ) : (
                  <Plot
                    data={[
                      {
                        values: processedStats.pieData.map((d) => d.value),
                        labels: processedStats.pieData.map((d) => d.name),
                        type: 'pie',
                        marker: {
                          colors: chartColors,
                        },
                        hoverinfo: 'label+percent',
                        textinfo: 'percent',
                        insidetextorientation: 'radial',
                      },
                    ]}
                    layout={{
                      height: 400,
                      margin: { t: 150, b: 40, l: 40, r: 40 },
                      showlegend: true,
                      legend: {
                        orientation: 'v',
                        x: 1.05,
                        y: 0.5,
                        xanchor: 'left',
                        yanchor: 'middle'
                      }
                    }}
                    config={{ responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </CardContent>
            </Card>
          ) : processedStats && processedStats.type === 'numerical' ? (
            <Card>
              <CardHeader>
                <CardTitle>Quick Summary</CardTitle>
                <CardDescription>Key insights for {selectedColumn?.label}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center p-4">Loading summary...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{processedStats.mean.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Average {selectedColumn?.label}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-semibold">{processedStats.min}</div>
                        <div className="text-xs text-muted-foreground">Minimum</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-semibold">{processedStats.max}</div>
                        <div className="text-xs text-muted-foreground">Maximum</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Quick Summary</CardTitle>
                <CardDescription>Select a variable to view summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 text-muted-foreground">No data available</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Histogram</CardTitle>
            <CardDescription>Distribution of {selectedColumn?.label} values</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center p-4">Loading histogram...</div>
            ) : histogramData.length > 0 ? (
              <Plot
                data={[
                  {
                    x: histogramData.map((d) =>
                      'value' in d ? d.value.toString() : d.category
                    ),
                    y: histogramData.map((d) => d.count),
                    type: 'bar',
                    marker: {
                      color: 'hsl(var(--chart-1))',
                    },
                  },
                ]}
                layout={{
                  height: 300,
                  xaxis: {
                    title: { text: isNumerical ? selectedColumn?.label : "Category" },
                    automargin: true,
                  },
                  yaxis: {
                    title: { text: "Count" },
                  },
                  margin: { t: 20, b: 80, l: 40, r: 20 },
                }}
                config={{ responsive: true }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="text-center p-4 text-muted-foreground">No data available for histogram</div>
            )}
          </CardContent>
        </Card>

        {/* Box Plot - Only for numerical variables using API data */}
        {processedStats && processedStats.type === 'numerical' && (
          <Card>
            <CardHeader>
              <CardTitle>Box Plot</CardTitle>
              <CardDescription>Five-number summary and outlier detection for {selectedColumn?.label}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">Loading box plot...</div>
              ) : (
                <Plot
                  data={[
                    {
                      y: [processedStats.min, processedStats.q1, processedStats.median, processedStats.q3, processedStats.max],
                      type: 'box',
                      name: selectedColumn?.label,
                      marker: {
                        color: 'hsl(var(--chart-1))',
                      },
                      boxpoints: false,
                    },
                  ]}
                  layout={{
                    height: 300,
                    margin: { l: 40, r: 40, b: 40, t: 40 },
                    yaxis: {
                      title: { text: selectedColumn?.label },
                      zeroline: false,
                    },
                    showlegend: false,
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
              <div className="text-sm text-muted-foreground space-y-1 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span>IQR:</span>
                    <span>{(processedStats.q3 - processedStats.q1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Range:</span>
                    <span>{(processedStats.max - processedStats.min).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
