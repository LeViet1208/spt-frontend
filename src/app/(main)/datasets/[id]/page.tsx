"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Hooks
import { useDataset } from "@/hooks/useDataset";
import { useDatasetAnalytics } from "@/hooks/useDatasetAnalytics";

// Dynamically import Plot with no SSR to avoid "self is not defined" error
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] flex items-center justify-center bg-muted rounded">
      Loading chart...
    </div>
  ),
});

const chartColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
];

interface DatasetDetailViewProps {
  params?: { id: string };
}

export default function DatasetDetailView({ params }: DatasetDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get dataset ID from either params or search params
  const datasetId = params?.id || searchParams.get("id");

  // Hooks
  const { fetchDataset, currentDataset, isLoading: datasetLoading } = useDataset();
  const {
    selectedTable,
    selectedVariable,
    processedStats,
    histogramData,
    isLoading: analyticsLoading,
    error: analyticsError,
    availableVariables,
    selectedVariableInfo,
    isNumerical,
    setSelectedTable,
    setSelectedVariable,
    childTables,
  } = useDatasetAnalytics(datasetId || undefined);

  const handleBack = () => {
    router.push("/datasets");
  };

  // Fetch dataset details when component mounts
  React.useEffect(() => {
    if (datasetId) {
      fetchDataset(parseInt(datasetId));
    }
  }, [datasetId, fetchDataset]);

  const isLoading = analyticsLoading || datasetLoading;

  return (
    <div className="space-y-6">
      {/* Variable Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Variable Selection</CardTitle>
          <CardDescription>
            Choose a child table and variable to analyze its descriptive
            statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Child Table
              </label>
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
              <label className="text-sm font-medium mb-2 block">
                Select Variable
              </label>
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
            <Badge variant={isNumerical ? "default" : "secondary"}>
              {selectedVariableInfo?.type}
            </Badge>
            {isLoading && (
              <span className="text-sm text-muted-foreground">Loading...</span>
            )}
            {analyticsError && (
              <span className="text-sm text-red-500">{analyticsError}</span>
            )}
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
              {isNumerical ? "Numerical" : "Categorical"} statistics for{" "}
              {selectedVariableInfo?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ) : analyticsError ? (
              <div className="text-center p-4 text-red-500">
                {analyticsError}
              </div>
            ) : processedStats ? (
              processedStats.type === "numerical" ? (
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
              <div className="text-center p-4 text-muted-foreground">
                Select a variable to view statistics
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart for Categorical or Summary for Numerical */}
        {processedStats && processedStats.type === "categorical" ? (
          <Card>
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
              <CardDescription>
                Pie chart showing the distribution of{" "}
                {selectedVariableInfo?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px] rounded" />
              ) : (
                <Plot
                  data={[
                    {
                      values: processedStats.pieData.map((d) => d.value),
                      labels: processedStats.pieData.map((d) => d.name),
                      type: "pie",
                      marker: {
                        colors: chartColors,
                      },
                      hoverinfo: "label+percent",
                      textinfo: "percent",
                      insidetextorientation: "radial",
                    },
                  ]}
                  layout={{
                    height: 400,
                    margin: { t: 150, b: 40, l: 40, r: 40 },
                    showlegend: true,
                    legend: {
                      orientation: "v",
                      x: 1.05,
                      y: 0.5,
                      xanchor: "left",
                      yanchor: "middle",
                    },
                  }}
                  config={{ responsive: true }}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </CardContent>
          </Card>
        ) : processedStats && processedStats.type === "numerical" ? (
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
              <CardDescription>
                Key insights for {selectedVariableInfo?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {processedStats.mean.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Average {selectedVariableInfo?.label}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold">{processedStats.min}</div>
                      <div className="text-xs text-muted-foreground">
                        Minimum
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold">{processedStats.max}</div>
                      <div className="text-xs text-muted-foreground">
                        Maximum
                      </div>
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
              <div className="text-center p-4 text-muted-foreground">
                No data available
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>Histogram</CardTitle>
          <CardDescription>
            Distribution of {selectedVariableInfo?.label} values
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[300px] rounded" />
          ) : histogramData.length > 0 ? (
            <Plot
              data={[
                {
                  x: histogramData.map((d) =>
                    "value" in d ? d.value?.toString() || "" : d.category || ""
                  ),
                  y: histogramData.map((d) => d.count),
                  type: "bar",
                  marker: {
                    color: "hsl(var(--chart-1))",
                  },
                },
              ]}
              layout={{
                height: 300,
                xaxis: {
                  title: {
                    text: isNumerical
                      ? selectedVariableInfo?.label
                      : "Category",
                  },
                  automargin: true,
                },
                yaxis: {
                  title: { text: "Count" },
                },
                margin: { t: 20, b: 80, l: 40, r: 20 },
              }}
              config={{ responsive: true }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No data available for histogram
            </div>
          )}
        </CardContent>
      </Card>

      {/* Box Plot - Only for numerical variables using API data */}
      {processedStats && processedStats.type === "numerical" && (
        <Card>
          <CardHeader>
            <CardTitle>Box Plot</CardTitle>
            <CardDescription>
              Five-number summary and outlier detection for{" "}
              {selectedVariableInfo?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-[300px] rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            ) : (
              <Plot
                data={[
                  {
                    y: [
                      processedStats.min,
                      processedStats.q1,
                      processedStats.median,
                      processedStats.q3,
                      processedStats.max,
                    ],
                    type: "box",
                    name: selectedVariableInfo?.label,
                    marker: {
                      color: "hsl(var(--chart-1))",
                    },
                    boxpoints: false,
                  },
                ]}
                layout={{
                  height: 300,
                  margin: { l: 40, r: 40, b: 40, t: 40 },
                  yaxis: {
                    title: { text: selectedVariableInfo?.label },
                    zeroline: false,
                  },
                  showlegend: false,
                }}
                config={{ responsive: true }}
                style={{ width: "100%", height: "100%" }}
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
                  <span>
                    {(processedStats.max - processedStats.min).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
