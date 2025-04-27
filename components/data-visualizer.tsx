"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface DataVisualizerProps {
  data: any[]
  columns: string[]
}

export function DataVisualizer({ data, columns }: DataVisualizerProps) {
  const [chartType, setChartType] = useState("bar")
  const [xAxis, setXAxis] = useState(columns[0] || "")
  const [yAxis, setYAxis] = useState(columns[1] || "")

  // Determine which columns are numeric
  const numericColumns = useMemo(() => {
    return columns.filter((column) => {
      // Check if at least 80% of values in this column are numeric
      const numericCount = data.reduce((count, row) => {
        const value = row[column]
        return count + (!isNaN(Number(value)) && value !== "" ? 1 : 0)
      }, 0)

      return numericCount / data.length > 0.8
    })
  }, [data, columns])

  // Determine which columns are categorical (good for x-axis)
  const categoricalColumns = useMemo(() => {
    return columns.filter((column) => {
      // Count unique values
      const uniqueValues = new Set(data.map((row) => row[column]))
      // Good categorical columns have a reasonable number of unique values
      return uniqueValues.size > 1 && uniqueValues.size <= Math.min(20, data.length / 5)
    })
  }, [data, columns])

  // Prepare data for visualization
  const chartData = useMemo(() => {
    if (!xAxis || !yAxis) return []

    // For pie chart, we need to aggregate data
    if (chartType === "pie") {
      const aggregated: Record<string, number> = {}

      data.forEach((row) => {
        const xValue = row[xAxis] || "Unknown"
        const yValue = Number(row[yAxis]) || 0

        if (aggregated[xValue]) {
          aggregated[xValue] += yValue
        } else {
          aggregated[xValue] = yValue
        }
      })

      return Object.entries(aggregated).map(([name, value]) => ({ name, value }))
    }

    // For bar and line charts
    return data.map((row) => ({
      [xAxis]: row[xAxis],
      [yAxis]: Number(row[yAxis]) || 0,
    }))
  }, [data, xAxis, yAxis, chartType])

  // Colors for charts
  const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57", "#ffc658"]

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">Select columns to visualize</div>
      )
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yAxis} fill="#8884d8" name={yAxis} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yAxis} stroke="#8884d8" name={yAxis} />
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value).toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!yAxis || numericColumns.length === 0) return null

    const values = data.map((row) => Number(row[yAxis])).filter((val) => !isNaN(val))

    if (values.length === 0) return null

    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / values.length
    const sortedValues = [...values].sort((a, b) => a - b)
    const median = sortedValues[Math.floor(sortedValues.length / 2)]
    const min = sortedValues[0]
    const max = sortedValues[sortedValues.length - 1]

    return { sum, mean, median, min, max, count: values.length }
  }, [data, yAxis, numericColumns])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Chart Type</label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">X-Axis (Category)</label>
          <Select value={xAxis} onValueChange={setXAxis}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select X-Axis" />
            </SelectTrigger>
            <SelectContent>
              {categoricalColumns.length > 0
                ? categoricalColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))
                : columns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Y-Axis (Value)</label>
          <Select value={yAxis} onValueChange={setYAxis}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Y-Axis" />
            </SelectTrigger>
            <SelectContent>
              {numericColumns.length > 0
                ? numericColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))
                : columns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Data Visualization</CardTitle>
            <CardDescription>
              {xAxis && yAxis ? `Visualizing ${yAxis} by ${xAxis}` : "Select columns to visualize data"}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderChart()}</CardContent>
        </Card>

        {summaryStats && (
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
              <CardDescription>Statistics for {yAxis}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Count</p>
                  <p className="text-2xl font-bold">{summaryStats.count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sum</p>
                  <p className="text-2xl font-bold">{summaryStats.sum.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mean</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Median</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Min</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Data Overview</CardTitle>
            <CardDescription>Summary of uploaded data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{data.length.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Columns</p>
                <p className="text-2xl font-bold">{columns.length.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Numeric Columns</p>
                <p className="text-2xl font-bold">{numericColumns.length.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categorical Columns</p>
                <p className="text-2xl font-bold">{categoricalColumns.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
