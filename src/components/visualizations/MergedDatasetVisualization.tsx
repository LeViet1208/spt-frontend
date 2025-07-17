"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, BarChart3, AlertCircle, Filter, Settings, Info } from "lucide-react";
import { useMergedVisualization } from "@/hooks/useMergedVisualization";
import { MergedVisualizationRequest } from "@/utils/types/dataset";
import dynamic from "next/dynamic";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface MergedDatasetVisualizationProps {
    datasetId: string;
}

export const MergedDatasetVisualization: React.FC<MergedDatasetVisualizationProps> = ({
    datasetId,
}) => {
    const {
        visualizationData,
        availableVariables,
        isLoading,
        isLoadingVariables,
        error,
        fetchMergedVisualization,
        fetchAvailableVariables,
        clearError,
        getVariablesByType,
        getVariableInfo,
    } = useMergedVisualization(datasetId);

    const [variable1, setVariable1] = useState("");
    const [variable2, setVariable2] = useState("");
    const [chartType, setChartType] = useState("");
    const [limit, setLimit] = useState(1000);
    const [aggregation, setAggregation] = useState("");
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [showFilters, setShowFilters] = useState(false);

    // Load available variables on mount
    useEffect(() => {
        fetchAvailableVariables();
    }, [fetchAvailableVariables]);

    // Set default variables when available
    useEffect(() => {
        if (availableVariables && !variable1) {
            const numericalVars = getVariablesByType("numerical");
            if (numericalVars.length > 0) {
                setVariable1(numericalVars[0].name);
            }
        }

        if (availableVariables && !variable2) {
            const categoricalVars = getVariablesByType("categorical");
            if (categoricalVars.length > 0) {
                setVariable2(categoricalVars[0].name);
            }
        }
    }, [availableVariables, variable1, variable2, getVariablesByType]);

    const handleGenerateVisualization = () => {
        if (!variable1 || !variable2) return;

        const request: MergedVisualizationRequest = {
            variable1,
            variable2,
            chart_type: chartType || undefined,
            limit,
            aggregation: aggregation || undefined,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
        };

        fetchMergedVisualization(request);
    };

    const canGenerate = variable1 && variable2 && variable1 !== variable2;

    const getVariableOptions = (type: "numerical" | "categorical" | "datetime") => {
        return getVariablesByType(type).map(varInfo => ({
            value: varInfo.name,
            label: `${varInfo.name} (${varInfo.description})`,
            type: varInfo.type,
        }));
    };

    const getChartTypeOptions = () => {
        if (!variable1 || !variable2) return [];

        const var1Info = getVariableInfo(variable1);
        const var2Info = getVariableInfo(variable2);

        if (!var1Info || !var2Info) return [];

        // Get recommended chart types based on variable types
        const type1 = var1Info.type;
        const type2 = var2Info.type;

        const chartOptions = {
            "numerical-numerical": ["scatter", "heatmap", "bubble"],
            "categorical-numerical": ["box", "violin", "bar"],
            "numerical-categorical": ["box", "violin", "bar"],
            "categorical-categorical": ["heatmap", "stacked_bar", "grouped_bar"],
            "datetime-numerical": ["line", "scatter", "area"],
            "numerical-datetime": ["line", "scatter", "area"],
            "datetime-categorical": ["line", "area", "bar"],
            "categorical-datetime": ["line", "area", "bar"],
        };

        const key = `${type1}-${type2}`;
        return chartOptions[key] || ["scatter"];
    };

    const renderFilters = () => {
        if (!showFilters) return null;

        return (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Filters</h4>
                {/* Add filter UI components here */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Example filter for store_id */}
                    <div>
                        <Label htmlFor="store_filter">Store ID</Label>
                        <Input
                            id="store_filter"
                            placeholder="Enter store ID"
                            value={filters.store_id || ""}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                store_id: e.target.value || undefined
                            }))}
                        />
                    </div>
                    {/* Add more filters as needed */}
                </div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Merged Dataset Visualization
                </CardTitle>
                <CardDescription>
                    Visualize relationships between any two variables from the merged dataset
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Variable Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Variable 1 */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Variable 1</h4>
                        <div className="space-y-2">
                            <Label htmlFor="variable1">Variable</Label>
                            <Select value={variable1} onValueChange={setVariable1}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select variable" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getVariableOptions("numerical").map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                    {getVariableOptions("categorical").map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                    {getVariableOptions("datetime").map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Variable 2 */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Variable 2</h4>
                        <div className="space-y-2">
                            <Label htmlFor="variable2">Variable</Label>
                            <Select value={variable2} onValueChange={setVariable2}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select variable" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getVariableOptions("numerical").map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                    {getVariableOptions("categorical").map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                    {getVariableOptions("datetime").map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Chart Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="chartType">Chart Type</Label>
                        <Select value={chartType} onValueChange={setChartType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Auto-select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Auto-select</SelectItem>
                                {getChartTypeOptions().map((chartType) => (
                                    <SelectItem key={chartType} value={chartType}>
                                        {chartType.replace("_", " ").toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="limit">Data Limit</Label>
                        <Input
                            id="limit"
                            type="number"
                            min="100"
                            max="10000"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value) || 1000)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="aggregation">Aggregation</Label>
                        <Select value={aggregation} onValueChange={setAggregation}>
                            <SelectTrigger>
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                <SelectItem value="mean">Mean</SelectItem>
                                <SelectItem value="median">Median</SelectItem>
                                <SelectItem value="sum">Sum</SelectItem>
                                <SelectItem value="count">Count</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filters Toggle */}
                <div className="flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {showFilters ? "Hide" : "Show"} Filters
                    </Button>

                    <Button
                        onClick={handleGenerateVisualization}
                        disabled={!canGenerate || isLoading}
                        className="flex items-center gap-2"
                    >
                        {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <BarChart3 className="h-4 w-4" />
                        )}
                        Generate Visualization
                    </Button>
                </div>

                {/* Filters Panel */}
                {renderFilters()}

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Error</span>
                        </div>
                        <p className="mt-1 text-sm text-destructive">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearError}
                            className="mt-2"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                {/* Visualization Display */}
                {visualizationData && (
                    <div className="space-y-4">
                        {/* Analysis Summary */}
                        <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">Analysis Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Chart Type:</span>{" "}
                                    {visualizationData.visualization.selected_chart}
                                </div>
                                <div>
                                    <span className="font-medium">Data Points:</span>{" "}
                                    {visualizationData.analysis.relationship.data_points}
                                </div>
                                {visualizationData.analysis.relationship.correlation && (
                                    <div>
                                        <span className="font-medium">Correlation:</span>{" "}
                                        {visualizationData.analysis.relationship.correlation.toFixed(3)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Plotly Chart */}
                        <div className="w-full overflow-hidden rounded-lg border">
                            <Plot
                                data={visualizationData.visualization.plotly_config.data}
                                layout={visualizationData.visualization.plotly_config.layout}
                                config={{
                                    responsive: true,
                                    displayModeBar: true,
                                    displaylogo: false,
                                    modeBarButtonsToRemove: ["pan2d", "lasso2d"],
                                }}
                                style={{ width: "100%" }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};