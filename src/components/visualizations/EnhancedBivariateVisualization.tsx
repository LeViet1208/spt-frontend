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
    onVisualizationUpdate?: (visualizationData: any) => void;
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

// ✅ NEW: Data type options for the dropdown
const DATA_TYPES = [
    { value: "numerical", label: "Numerical" },
    { value: "categorical", label: "Categorical" },
    { value: "binary", label: "Binary" },
    { value: "datetime", label: "Datetime" },
];

export const EnhancedBivariateVisualization: React.FC<EnhancedBivariateVisualizationProps> = ({
    datasetId,
    onVisualizationUpdate,
}) => {
    const [availableVariables, setAvailableVariables] = useState<EnhancedMergedVariablesResponse | null>(null);
    const [mergedDatasetData, setMergedDatasetData] = useState<any[]>([]);
    const [variable1, setVariable1] = useState<string>("");
    const [variable2, setVariable2] = useState<string>("");
    const [variable1Type, setVariable1Type] = useState<string>(""); // ✅ NEW: Type for variable 1
    const [variable2Type, setVariable2Type] = useState<string>(""); // ✅ NEW: Type for variable 2
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

    // Notify parent when visualization data changes
    useEffect(() => {
        if (onVisualizationUpdate && visualizationData) {
            onVisualizationUpdate(visualizationData);
        }
    }, [visualizationData, onVisualizationUpdate]);

    // ✅ NEW: Update variable types when variables change
    useEffect(() => {
        if (variable1) {
            const attr = getAvailableAttributes.find(attr => attr.name === variable1);
            setVariable1Type(attr?.type || "");
        }
    }, [variable1]);

    useEffect(() => {
        if (variable2) {
            const attr = getAvailableAttributes.find(attr => attr.name === variable2);
            setVariable2Type(attr?.type || "");
        }
    }, [variable2]);

    // Get available attributes from backend or fallback to predefined list
    const getAvailableAttributes = useMemo(() => {
        if (availableVariables?.variables?.all) {
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

    // ✅ MODIFIED: Use selected types instead of auto-detection
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
            // ✅ MODIFIED: Use selected types
            const plotData = generateClientSideVisualization(variable1, variable2, mergedDatasetData, variable1Type, variable2Type);
            setVisualizationData(plotData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    // ✅ MODIFIED: Accept explicit types
    const generateClientSideVisualization = (var1: string, var2: string, data: any[], type1: string, type2: string) => {
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
                const categoricalVar = type1 === "categorical" ? var1 : var2;
                const numericalVar = type1 === "numerical" ? var1 : var2;

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

    // ✅ NEW: Render variable selection section
    const renderVariableSection = (
        variable: string,
        setVariable: (value: string) => void,
        variableType: string,
        setVariableType: (value: string) => void,
        searchTerm: string,
        setSearchTerm: (value: string) => void,
        label: string
    ) => (
        <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium">{label}</Label>

            {/* Attribute Selection */}
            {uiMode === "searchable" ? (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search for ${label.toLowerCase()} attribute`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                    {searchTerm && (
                        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                            {getFilteredAttributes(searchTerm).map((attr) => (
                                <div
                                    key={attr.name}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer"
                                    onClick={() => {
                                        setVariable(attr.name);
                                        setVariableType(attr.type);
                                        setSearchTerm("");
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
            ) : (
                <Select value={variable} onValueChange={(value) => {
                    setVariable(value);
                    const attr = getAvailableAttributes.find(attr => attr.name === value);
                    setVariableType(attr?.type || "");
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder={`Select ${label.toLowerCase()} attribute`} />
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
            )}

            {/* Data Type Selection */}
            <Select value={variableType} onValueChange={setVariableType}>
                <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                    {DATA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                            {type.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

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

    // ✅ MODIFIED: New layout with side-by-side variables
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Variable Selection
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

                {/* ✅ NEW: Side-by-side variable selection */}
                <div className="flex flex-row gap-6">
                    {/* Variable A */}
                    <div className="flex-1">
                        {renderVariableSection(
                            variable1,
                            setVariable1,
                            variable1Type,
                            setVariable1Type,
                            searchTerm1,
                            setSearchTerm1,
                            "Variable A"
                        )}
                    </div>

                    {/* Variable B */}
                    <div className="flex-1">
                        {renderVariableSection(
                            variable2,
                            setVariable2,
                            variable2Type,
                            setVariable2Type,
                            searchTerm2,
                            setSearchTerm2,
                            "Variable B"
                        )}
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
            </CardContent>
        </Card>
    );
}; 