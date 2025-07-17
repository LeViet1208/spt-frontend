"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, Search } from "lucide-react";
import { datasetService } from "@/utils/services/dataset";
import { EnhancedMergedVariablesResponse } from "@/utils/types/dataset";
import dynamic from "next/dynamic";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface EnhancedBivariateVisualizationProps {
    datasetId: string;
}

// Predefined attribute list as requested
const PREDEFINED_ATTRIBUTES = [
    // Numerical attributes
    { name: "sale_price", type: "numerical", label: "Sale Price", description: "The price at which the item was sold" },
    { name: "sale_quantity", type: "numerical", label: "Sale Quantity", description: "The quantity of items sold in the transaction" },
    { name: "unit_price", type: "numerical", label: "Unit Price", description: "The price per unit of the item" },
    { name: "product_size", type: "numerical", label: "Product Size", description: "The size or volume of the product" },
    { name: "week", type: "numerical", label: "Week", description: "The week number of the transaction" },

    // Categorical attributes
    { name: "brand", type: "categorical", label: "Brand", description: "The brand name of the product" },
    { name: "category", type: "categorical", label: "Category", description: "The product category or department" },
    { name: "product_description", type: "categorical", label: "Product Description", description: "Detailed description of the product" },
    { name: "upc", type: "categorical", label: "UPC", description: "Universal Product Code identifier" },
    { name: "store_id", type: "categorical", label: "Store ID", description: "Unique identifier for the store" },
    { name: "household_id", type: "categorical", label: "Household ID", description: "Unique identifier for the household" },
    { name: "trip_id", type: "categorical", label: "Trip ID", description: "Unique identifier for the shopping trip" },
    { name: "feature", type: "binary", label: "Feature", description: "Whether the product was featured in promotions" },
    { name: "display", type: "binary", label: "Display", description: "Whether the product was on display" },

    // Datetime attributes
    { name: "time", type: "datetime", label: "Time", description: "Timestamp of the transaction" },
    { name: "start_time", type: "datetime", label: "Start Time", description: "Start time of the promotion period" },
    { name: "end_time", type: "datetime", label: "End Time", description: "End time of the promotion period" },
];

export const EnhancedBivariateVisualization: React.FC<EnhancedBivariateVisualizationProps> = ({
    datasetId,
}) => {
    const [availableVariables, setAvailableVariables] = useState<EnhancedMergedVariablesResponse | null>(null);
    const [mergedDatasetData, setMergedDatasetData] = useState<any[]>([]);
    const [variable1, setVariable1] = useState<string>("");
    const [variable2, setVariable2] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visualizationData, setVisualizationData] = useState<any>(null);
    const [uiMode, setUiMode] = useState<"dropdown" | "searchable">("dropdown");
    const [searchTerm1, setSearchTerm1] = useState("");
    const [searchTerm2, setSearchTerm2] = useState("");

    // Load available variables and merged dataset data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // ✅ CORRECT: Only fetch variable metadata and merged dataset data
                const [variablesResult, datasetResult] = await Promise.all([
                    datasetService.getEnhancedMergedVariables(datasetId),
                    datasetService.getMergedDatasetData(datasetId)
                ]);

                if (variablesResult.success && variablesResult.data) {
                    setAvailableVariables(variablesResult.data);
                } else {
                    setError(variablesResult.error || "Failed to load variables");
                }

                if (datasetResult.success && datasetResult.data) {
                    setMergedDatasetData(datasetResult.data.data || []);
                } else {
                    setError(datasetResult.error || "Failed to load dataset data");
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        if (datasetId) {
            loadData();
        }
    }, [datasetId]);

    // Get available attributes from backend or fallback to predefined list
    const getAvailableAttributes = useMemo(() => {
        if (availableVariables?.variables?.all) {
            // Use backend data if available
            return Object.entries(availableVariables.variables.all)
                .map(([name, variable]) => ({
                    name,
                    type: variable.type,
                    label: variable.name || name,
                    description: variable.description || "",
                    sourceTable: variable.source_table || ""
                }))
                .filter(attr => PREDEFINED_ATTRIBUTES.some(predefined => predefined.name === attr.name));
        }

        // Fallback to predefined list
        return PREDEFINED_ATTRIBUTES;
    }, [availableVariables]);

    // Filter attributes based on search terms
    const getFilteredAttributes = (searchTerm: string) => {
        return getAvailableAttributes.filter(attr =>
            attr.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            attr.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    // Get data type for selected variable
    const getVariableType = (variableName: string) => {
        const attribute = getAvailableAttributes.find(attr => attr.name === variableName);
        return attribute?.type || "unknown";
    };

    // ✅ CORRECT: Client-side visualization generation
    const handleGenerateGraph = async () => {
        if (!variable1 || !variable2) {
            setError("Please select both variables");
            return;
        }

        if (mergedDatasetData.length === 0) {
            setError("No dataset data available for visualization");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // ✅ CORRECT: Generate visualization entirely on client-side
            const plotData = generateClientSideVisualization(variable1, variable2, mergedDatasetData);
            setVisualizationData(plotData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    // ✅ NEW: Client-side visualization generation
    const generateClientSideVisualization = (var1: string, var2: string, data: any[]) => {
        const type1 = getVariableType(var1);
        const type2 = getVariableType(var2);

        // Filter data to only include rows where both variables have values
        const validData = data.filter(row =>
            row[var1] !== null && row[var1] !== undefined &&
            row[var2] !== null && row[var2] !== undefined
        );

        if (validData.length === 0) {
            throw new Error("No valid data points found for the selected variables");
        }

        // Determine chart type based on variable types
        let chartType = "scatter";
        if (type1 === "numerical" && type2 === "numerical") {
            chartType = "scatter";
        } else if ((type1 === "categorical" && type2 === "numerical") ||
            (type1 === "numerical" && type2 === "categorical")) {
            chartType = "bar";
        } else if (type1 === "categorical" && type2 === "categorical") {
            chartType = "heatmap";
        } else if (type1 === "datetime" || type2 === "datetime") {
            chartType = "line";
        }

        // Generate Plotly configuration based on chart type
        let plotlyConfig: any = {};

        switch (chartType) {
            case "scatter":
                plotlyConfig = {
                    data: [{
                        x: validData.map(row => row[var1]),
                        y: validData.map(row => row[var2]),
                        mode: "markers",
                        type: "scatter",
                        marker: {
                            size: 8,
                            opacity: 0.6,
                            color: "rgb(59, 130, 246)"
                        }
                    }],
                    layout: {
                        title: `${var1} vs ${var2}`,
                        xaxis: { title: var1 },
                        yaxis: { title: var2 },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            case "bar":
                // For categorical vs numerical, create bar chart
                const categoricalVar = type1 === "categorical" ? var1 : var2;
                const numericalVar = type1 === "numerical" ? var1 : var2;

                // Group by categorical variable and calculate mean of numerical variable
                const groupedData = validData.reduce((acc: any, row) => {
                    const category = row[categoricalVar];
                    if (!acc[category]) {
                        acc[category] = { sum: 0, count: 0 };
                    }
                    acc[category].sum += Number(row[numericalVar]) || 0;
                    acc[category].count += 1;
                    return acc;
                }, {});

                const categories = Object.keys(groupedData);
                const values = categories.map(cat => groupedData[cat].sum / groupedData[cat].count);

                plotlyConfig = {
                    data: [{
                        x: categories,
                        y: values,
                        type: "bar",
                        marker: {
                            color: "rgb(59, 130, 246)"
                        }
                    }],
                    layout: {
                        title: `${numericalVar} by ${categoricalVar}`,
                        xaxis: { title: categoricalVar },
                        yaxis: { title: `Average ${numericalVar}` },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            case "heatmap":
                // For categorical vs categorical, create heatmap
                const uniqueVar1 = [...new Set(validData.map(row => row[var1]))];
                const uniqueVar2 = [...new Set(validData.map(row => row[var2]))];

                const heatmapData = uniqueVar2.map(v2 =>
                    uniqueVar1.map(v1 =>
                        validData.filter(row => row[var1] === v1 && row[var2] === v2).length
                    )
                );

                plotlyConfig = {
                    data: [{
                        x: uniqueVar1,
                        y: uniqueVar2,
                        z: heatmapData,
                        type: "heatmap",
                        colorscale: "Viridis"
                    }],
                    layout: {
                        title: `${var1} vs ${var2} - Frequency Heatmap`,
                        xaxis: { title: var1 },
                        yaxis: { title: var2 },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            case "line":
                // For datetime variables, create line chart
                const sortedData = validData.sort((a, b) => {
                    const dateA = new Date(a[type1 === "datetime" ? var1 : var2]);
                    const dateB = new Date(b[type1 === "datetime" ? var1 : var2]);
                    return dateA.getTime() - dateB.getTime();
                });

                plotlyConfig = {
                    data: [{
                        x: sortedData.map(row => row[type1 === "datetime" ? var1 : var2]),
                        y: sortedData.map(row => row[type1 === "datetime" ? var2 : var1]),
                        type: "scatter",
                        mode: "lines+markers",
                        line: { color: "rgb(59, 130, 246)" }
                    }],
                    layout: {
                        title: `${var1} vs ${var2}`,
                        xaxis: { title: type1 === "datetime" ? var1 : var2 },
                        yaxis: { title: type1 === "datetime" ? var2 : var1 },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            default:
                plotlyConfig = {
                    data: [{
                        x: validData.map(row => row[var1]),
                        y: validData.map(row => row[var2]),
                        mode: "markers",
                        type: "scatter"
                    }],
                    layout: {
                        title: `${var1} vs ${var2}`,
                        xaxis: { title: var1 },
                        yaxis: { title: var2 },
                        height: 500
                    }
                };
        }

        return {
            chartType,
            plotlyConfig,
            dataPoints: validData.length,
            variable1: var1,
            variable2: var2
        };
    };

    // Render searchable select component
    const renderSearchableSelect = (
        value: string,
        onChange: (value: string) => void,
        searchTerm: string,
        onSearchChange: (value: string) => void,
        placeholder: string,
        label: string
    ) => (
        <div className="space-y-2">
            <Label htmlFor={`${label.toLowerCase()}-select`}>{label}</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                        {getFilteredAttributes(searchTerm).map((attr) => (
                            <div
                                key={attr.name}
                                className="px-3 py-2 hover:bg-accent cursor-pointer"
                                onClick={() => {
                                    onChange(attr.name);
                                    onSearchChange("");
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{attr.label}</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {attr.type}
                                    </Badge>
                                </div>
                                {attr.description && attr.description.trim() && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {attr.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Render dropdown select component
    const renderDropdownSelect = (
        value: string,
        onChange: (value: string) => void,
        placeholder: string,
        label: string
    ) => (
        <div className="space-y-2">
            <Label htmlFor={`${label.toLowerCase()}-select`}>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={`${label.toLowerCase()}-select`} className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                    {getAvailableAttributes.map((attr) => (
                        <SelectItem key={attr.name} value={attr.name}>
                            <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{attr.label}</span>
                                <Badge variant="secondary" className="text-xs ml-2">
                                    {attr.type}
                                </Badge>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    // Render data type indicator
    const renderDataTypeIndicator = (variableName: string, label: string) => {
        const dataType = getVariableType(variableName);
        const typeColors = {
            numerical: "bg-blue-100 text-blue-800",
            categorical: "bg-green-100 text-green-800",
            binary: "bg-purple-100 text-purple-800",
            datetime: "bg-orange-100 text-orange-800",
            unknown: "bg-gray-100 text-gray-800"
        };

        return (
            <div className="space-y-1">
                <Label className="text-sm font-medium">{label} Data Type</Label>
                <div className={`px-3 py-2 rounded-md text-sm font-medium ${typeColors[dataType as keyof typeof typeColors] || typeColors.unknown}`}>
                    {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading variables and dataset...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Bivariate Visualization
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* UI Mode Toggle */}
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Selection Mode</Label>
                    <div className="flex gap-2">
                        <Button
                            variant={uiMode === "dropdown" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUiMode("dropdown")}
                        >
                            Dropdown
                        </Button>
                        <Button
                            variant={uiMode === "searchable" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUiMode("searchable")}
                        >
                            Searchable
                        </Button>
                    </div>
                </div>

                {/* Variable Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Variable 1 */}
                    <div className="space-y-4">
                        {uiMode === "searchable" ? (
                            renderSearchableSelect(
                                variable1,
                                setVariable1,
                                searchTerm1,
                                setSearchTerm1,
                                "Search for first variable",
                                "Variable 1"
                            )
                        ) : (
                            renderDropdownSelect(
                                variable1,
                                setVariable1,
                                "Select first variable",
                                "Variable 1"
                            )
                        )}

                        {/* Data Type Indicator */}
                        {variable1 && renderDataTypeIndicator(variable1, "Variable 1")}
                    </div>

                    {/* Variable 2 */}
                    <div className="space-y-4">
                        {uiMode === "searchable" ? (
                            renderSearchableSelect(
                                variable2,
                                setVariable2,
                                searchTerm2,
                                setSearchTerm2,
                                "Search for second variable",
                                "Variable 2"
                            )
                        ) : (
                            renderDropdownSelect(
                                variable2,
                                setVariable2,
                                "Select second variable",
                                "Variable 2"
                            )
                        )}

                        {/* Data Type Indicator */}
                        {variable2 && renderDataTypeIndicator(variable2, "Variable 2")}
                    </div>
                </div>

                {/* Generate Graph Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleGenerateGraph}
                        disabled={!variable1 || !variable2 || isGenerating || mergedDatasetData.length === 0}
                        className="flex items-center gap-2 px-8 py-3"
                        size="lg"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <BarChart3 className="h-5 w-5" />
                                Generate Graph
                            </>
                        )}
                    </Button>
                </div>

                {/* Visualization Display */}
                {visualizationData && (
                    <div className="mt-6">
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                            <h4 className="font-medium mb-2">Visualization Results</h4>
                            <p className="text-sm text-muted-foreground">
                                {visualizationData.variable1} vs {visualizationData.variable2} - {visualizationData.chartType} chart
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Data points: {visualizationData.dataPoints}
                            </p>
                        </div>

                        {visualizationData.plotlyConfig && (
                            <div className="border rounded-lg p-4">
                                <Plot
                                    data={visualizationData.plotlyConfig.data}
                                    layout={visualizationData.plotlyConfig.layout}
                                    config={{ responsive: true }}
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Placeholder when no visualization */}
                {!visualizationData && variable1 && variable2 && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Click "Generate Graph" to visualize the relationship between {variable1} and {variable2}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 