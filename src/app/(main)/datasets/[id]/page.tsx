"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PieChart, BarChart, BoxSelect, TrendingUp } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Hooks
import { useDataset } from "@/hooks/useDataset";
import { useDatasetAnalytics } from "@/hooks/useDatasetAnalytics";

// Components
import { EnhancedBivariateVisualization } from "@/components/visualizations/EnhancedBivariateVisualization";

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

  const [selectedChart, setSelectedChart] = useState<
    "distribution" | "histogram" | "boxPlot"
  >("histogram");
  const [activeTab, setActiveTab] = useState("univariate");

  React.useEffect(() => {
    if (isNumerical) {
      setSelectedChart("histogram");
    } else {
      setSelectedChart("distribution");
    }
  }, [isNumerical]);

  const handleBack = () => {
    router.push("/datasets");
  };

  const isLoading = analyticsLoading || datasetLoading;

  // Chart Selection Component - now embedded inside chart cards
  const ChartSelectionButtons = () => (
    <div className="flex gap-2 mb-4">
      {processedStats && processedStats.type === "categorical" && (
        <Button
          variant={selectedChart === "distribution" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedChart("distribution")}
          title="Distribution"
        >
          <PieChart className="h-4 w-4 mr-2" />
          Distribution
        </Button>
      )}
      <Button
        variant={selectedChart === "histogram" ? "default" : "outline"}
        size="sm"
        onClick={() => setSelectedChart("histogram")}
        title="Histogram"
      >
        <BarChart className="h-4 w-4 mr-2" />
        Histogram
      </Button>
      {processedStats && processedStats.type === "numerical" && (
        <Button
          variant={selectedChart === "boxPlot" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedChart("boxPlot")}
          title="Box Plot"
        >
          <BoxSelect className="h-4 w-4 mr-2" />
          Box Plot
        </Button>
      )}
    </div>
  );

  // ✅ NEW: State for bivariate visualization data
  const [bivariateVisualizationData, setBivariateVisualizationData] = useState<any>(null);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Column: Chart Display Area - Full Height */}
      <div className="flex-1 mr-6 overflow-auto">
        <div className="h-full flex flex-col">
          {activeTab === "univariate" && (
            <>
              {/* Render selected chart */}
              {selectedChart === "distribution" && processedStats && processedStats.type === "categorical" && (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Distribution</CardTitle>
                        <CardDescription>
                          Pie chart showing the distribution of{" "}
                          {selectedVariableInfo?.label}
                        </CardDescription>
                      </div>
                    </div>
                    <ChartSelectionButtons />
                  </CardHeader>
                  <CardContent className="flex-1">
                    {isLoading ? (
                      <Skeleton className="w-full h-full rounded" />
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
                          margin: { t: 150, b: 20, l: 40, r: 40 },
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
              )}

              {selectedChart === "histogram" && (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Histogram</CardTitle>
                        <CardDescription>
                          Distribution of {selectedVariableInfo?.label} values
                        </CardDescription>
                      </div>
                    </div>
                    <ChartSelectionButtons />
                  </CardHeader>
                  <CardContent className="flex-1">
                    {isLoading ? (
                      <Skeleton className="w-full h-full rounded" />
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
                          margin: { t: 50, b: 50, l: 50, r: 20 },
                        }}
                        config={{ responsive: true }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div className="text-center p-4 text-muted-foreground flex items-center justify-center h-full">
                        No data available for histogram
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedChart === "boxPlot" && processedStats && processedStats.type === "numerical" && (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Box Plot</CardTitle>
                        <CardDescription>
                          Five-number summary and outlier detection for{" "}
                          {selectedVariableInfo?.label}
                        </CardDescription>
                      </div>
                    </div>
                    <ChartSelectionButtons />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {isLoading ? (
                      <Skeleton className="w-full flex-1 rounded" />
                    ) : (
                      <>
                        <div className="flex-1">
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
                              margin: { t: 50, b: 50, l: 50, r: 20 },
                              yaxis: {
                                title: { text: selectedVariableInfo?.label },
                                zeroline: false,
                              },
                              showlegend: false,
                            }}
                            config={{ responsive: true }}
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
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
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {activeTab === "bivariate" && (
            <Card className="w-full h-full flex-1 flex flex-col">
              <CardContent className="flex-1 flex flex-col">
                {/* ✅ MODIFIED: Simplified instructional text at the top */}
                <div className="mb-4">
                  <div className="text-left space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Bivariate Analysis</h3>
                    <p className="text-xs text-muted-foreground">
                      Configure your variables in the right panel and generate a visualization to explore relationships between two variables.
                    </p>
                  </div>
                </div>

                {/* ✅ MODIFIED: Visualization area below instructional text */}
                <div className="flex-1">
                  {bivariateVisualizationData ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Visualization Results</h4>
                        <p className="text-sm text-muted-foreground">
                          {bivariateVisualizationData.variable1} vs {bivariateVisualizationData.variable2} - {bivariateVisualizationData.chartType} chart
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Data points: {bivariateVisualizationData.dataPoints}
                        </p>
                      </div>

                      {bivariateVisualizationData.plotlyConfig && (
                        <div className="border rounded-lg p-4">
                          <Plot
                            data={bivariateVisualizationData.plotlyConfig.data}
                            layout={bivariateVisualizationData.plotlyConfig.layout}
                            config={{ responsive: true }}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Select variables and click "Generate Graph" to visualize relationships
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right Column: Controls and Analysis Tabs */}
      <div className="w-96 overflow-auto">
        <div className="space-y-4">
          {/* Analysis Type Tabs - Now in the right column */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="univariate" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Univariate
              </TabsTrigger>
              <TabsTrigger value="bivariate" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Bivariate
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Variable Selection - Only show for univariate analysis */}
          {activeTab === "univariate" && (
            <Card>
              <CardHeader>
                <CardTitle>Attribute Selection</CardTitle>
                <CardDescription>
                  Choose a data type and attribute to analyze its descriptive
                  statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Data Type
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
                      Select Attribute
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
          )}

          {/* Descriptive Statistics - Only show for univariate analysis */}
          {activeTab === "univariate" && (
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
                    </div>
                  )
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    Select a variable to view statistics
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bivariate Analysis Controls - Only show for bivariate analysis */}
          {activeTab === "bivariate" && (
            <div className="space-y-4">
              <EnhancedBivariateVisualization
                datasetId={datasetId || ""}
                onVisualizationUpdate={setBivariateVisualizationData} // ✅ NEW: Callback
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
