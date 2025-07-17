"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BarChart3, AlertCircle, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useMergedVisualization } from "@/hooks/useMergedVisualization";
import { MergedVisualizationRequest, MergedVisualizationPayload } from "@/utils/types/dataset";
import dynamic from "next/dynamic";
import { validateVariableName, createSafeSelectOptions, createSafeSelectItems } from "@/utils/validation";

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
    } = useMergedVisualization(datasetId);

    const [variable1, setVariable1] = useState("");
    const [variable2, setVariable2] = useState("");
    const [chartType, setChartType] = useState("");
    const [limit, setLimit] = useState(1000);
    const [aggregation, setAggregation] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({});

    // Load available variables on mount
    useEffect(() => {
        fetchAvailableVariables();
    }, [fetchAvailableVariables]);

    // Set default variables when available
    useEffect(() => {
        if (availableVariables && !variable1) {
            const numericalVars = getVariablesByType("numerical");
            if (numericalVars.length > 0 && numericalVars[0] && numericalVars[0].name) {
                setVariable1(numericalVars[0].name);
            }
        }

        if (availableVariables && !variable2) {
            const categoricalVars = getVariablesByType("categorical");
            if (categoricalVars.length > 0 && categoricalVars[0] && categoricalVars[0].name) {
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
        const variables = getVariablesByType(type)
            .filter(varInfo => varInfo && validateVariableName(varInfo.name))
            .map(varInfo => ({
                value: varInfo!.name,
                label: `${varInfo!.name}${varInfo!.description ? ` (${varInfo!.description})` : ''}`,
                type: varInfo!.type,
                description: varInfo!.description || '',
            }));

        return createSafeSelectOptions(variables);
    };

    const getChartTypeOptions = (): string[] => {
        if (!variable1 || !variable2 || !availableVariables?.variables?.all) return [];

        const var1Info = availableVariables.variables.all[variable1];
        const var2Info = availableVariables.variables.all[variable2];

        if (!var1Info || !var2Info) return [];

        const type1 = var1Info.type;
        const type2 = var2Info.type;

        const chartOptions: Record<string, string[]> = {
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

    const renderVariableSelect = (variable: string, setVariable: (value: string) => void, label: string) => (
        <div className="space-y-4">
            <h4 className="font-medium">{label}</h4>
            <div className="space-y-2">
                <Label htmlFor={`variable-${label.toLowerCase().replace(/\s+/g, '-')}`}>Variable</Label>
                <Select value={variable} onValueChange={setVariable}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select variable" />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="max-h-60 overflow-y-auto">
                            {/* Numerical Variables */}
                            {getVariableOptions("numerical").length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                        Numerical Variables
                                    </div>
                                    {createSafeSelectItems(getVariableOptions("numerical")).map((option) => (
                                        <SelectItem key={option.key} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </div>
                            )}

                            {/* Categorical Variables */}
                            {getVariableOptions("categorical").length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                        Categorical Variables
                                    </div>
                                    {createSafeSelectItems(getVariableOptions("categorical")).map((option) => (
                                        <SelectItem key={option.key} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </div>
                            )}

                            {/* Datetime Variables */}
                            {getVariableOptions("datetime").length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                        Datetime Variables
                                    </div>
                                    {createSafeSelectItems(getVariableOptions("datetime")).map((option) => (
                                        <SelectItem key={option.key} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </div>
                            )}

                            {/* No variables available */}
                            {getVariableOptions("numerical").length === 0 &&
                                getVariableOptions("categorical").length === 0 &&
                                getVariableOptions("datetime").length === 0 && (
                                    <SelectItem value="no-variables" disabled>
                                        No variables available
                                    </SelectItem>
                                )}
                        </div>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderFilters = () => {
        if (!showFilters) return null;

        return (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Filters</h4>
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
                    Visualize relationships between variables from the merged dataset
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Variable Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderVariableSelect(variable1, setVariable1, "Variable 1")}
                    {renderVariableSelect(variable2, setVariable2, "Variable 2")}
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
                                <SelectItem value="auto">Auto-select</SelectItem>
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
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="mean">Mean</SelectItem>
                                <SelectItem value="median">Median</SelectItem>
                                <SelectItem value="sum">Sum</SelectItem>
                                <SelectItem value="count">Count</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filters Toggle */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {showFilters ? (
                            <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                            <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                    </Button>
                </div>

                {/* Filters Section */}
                {renderFilters()}

                {/* Generate Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleGenerateVisualization}
                        disabled={!canGenerate || isLoading}
                        className="flex justify-center w-full md:w-auto"
                    >
                        {isLoading ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <BarChart3 className="h-4 w-4 mr-2" />
                        )}
                        Generate Visualization
                    </Button>
                </div>

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

                {/* Loading State */}
                {isLoadingVariables && (
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading available variables...</p>
                    </div>
                )}

                {/* Visualization Display */}
                {visualizationData && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Visualization</h3>
                            <Badge variant="outline">
                                {visualizationData.visualization?.selected_chart || "Auto-selected"}
                            </Badge>
                        </div>
                        <div className="w-full h-[400px]">
                            <Plot
                                data={visualizationData.visualization?.plotly_config?.data || []}
                                layout={visualizationData.visualization?.plotly_config?.layout || {}}
                                config={{ responsive: true }}
                                style={{ width: "100%", height: "100%" }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};