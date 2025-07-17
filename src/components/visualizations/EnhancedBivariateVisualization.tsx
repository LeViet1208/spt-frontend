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
import {
    ScatterChart,
    TrendingUp,
    Square,
    Box,
    Music,
    CircleDot,
    AreaChart,
    Layers,
    Grid3X3,
    BarChart,
    PieChart,
    TrendingDown, // Use this instead of Stairs
    Hexagon,
    BarChartHorizontal // Use this instead of BarChart3 for grouped bar
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Data type options for the dropdown
const DATA_TYPES = [
    { value: "numerical", label: "Numerical" },
    { value: "categorical", label: "Categorical" },
    { value: "binary", label: "Binary" },
    { value: "datetime", label: "Datetime" },
];

interface GraphType {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    compatibleTypes: string[][]; // Array of compatible type pairs
    description: string;
}

const GRAPH_TYPES: GraphType[] = [
    {
        id: "scatter",
        name: "Scatter Plot",
        icon: ScatterChart,
        compatibleTypes: [
            ["numerical", "numerical"],
            ["numerical", "categorical"],
            ["categorical", "numerical"]
        ],
        description: "Shows relationship between two variables with individual data points"
    },
    {
        id: "hexbin",
        name: "2D Histogram",
        icon: Hexagon,
        compatibleTypes: [
            ["numerical", "numerical"]
        ],
        description: "Density visualization for numerical data using hexagonal bins"
    },
    {
        id: "box",
        name: "Box Plot",
        icon: Box,
        compatibleTypes: [
            ["categorical", "numerical"],
            ["numerical", "categorical"]
        ],
        description: "Shows distribution statistics and outliers"
    },
    {
        id: "violin",
        name: "Violin Plot",
        icon: Music,
        compatibleTypes: [
            ["categorical", "numerical"],
            ["numerical", "categorical"]
        ],
        description: "Shows data distribution shape with density estimation"
    },
    {
        id: "swarm",
        name: "Strip Plot",
        icon: CircleDot,
        compatibleTypes: [
            ["categorical", "numerical"],
            ["numerical", "categorical"]
        ],
        description: "Shows individual data points with jitter to avoid overlap"
    },
    {
        id: "line",
        name: "Line Chart",
        icon: TrendingUp,
        compatibleTypes: [
            ["datetime", "numerical"],
            ["numerical", "datetime"],
            ["numerical", "numerical"]
        ],
        description: "Shows trends over time or continuous relationships"
    },
    {
        id: "area",
        name: "Area Chart",
        icon: AreaChart,
        compatibleTypes: [
            ["datetime", "numerical"],
            ["numerical", "datetime"]
        ],
        description: "Filled area showing cumulative or stacked values over time"
    },
    {
        id: "grouped_bar",
        name: "Grouped Bar Chart",
        icon: BarChartHorizontal, // Changed from BarChart3
        compatibleTypes: [
            ["categorical", "categorical"],
            ["categorical", "numerical"],
            ["numerical", "categorical"]
        ],
        description: "Multiple bars grouped by categories"
    },
    {
        id: "heatmap",
        name: "Heatmap",
        icon: Grid3X3,
        compatibleTypes: [
            ["categorical", "categorical"],
            ["numerical", "numerical"]
        ],
        description: "Color-coded matrix showing relationships or frequencies"
    },
    {
        id: "stacked_bar",
        name: "Stacked Bar Chart",
        icon: Layers,
        compatibleTypes: [
            ["categorical", "categorical"],
            ["categorical", "numerical"]
        ],
        description: "Bars with segments showing composition"
    },
    {
        id: "side_by_side",
        name: "Side-by-side Bar Chart",
        icon: BarChart,
        compatibleTypes: [
            ["categorical", "categorical"],
            ["categorical", "numerical"]
        ],
        description: "Adjacent bars for easy comparison"
    },
    {
        id: "count",
        name: "Count Plot",
        icon: PieChart,
        compatibleTypes: [
            ["categorical", "categorical"]
        ],
        description: "Shows frequency counts for categorical data"
    },
    {
        id: "step",
        name: "Step Plot",
        icon: TrendingDown, // Changed from Stairs
        compatibleTypes: [
            ["datetime", "numerical"],
            ["numerical", "datetime"]
        ],
        description: "Step-wise line chart for discrete changes"
    }
];

export const EnhancedBivariateVisualization: React.FC<EnhancedBivariateVisualizationProps> = ({
    datasetId,
    onVisualizationUpdate,
}) => {
    const [availableVariables, setAvailableVariables] = useState<EnhancedMergedVariablesResponse | null>(null);
    const [mergedDatasetData, setMergedDatasetData] = useState<any[]>([]);
    const [variable1, setVariable1] = useState<string>("");
    const [variable2, setVariable2] = useState<string>("");
    const [variable1Type, setVariable1Type] = useState<string>("");
    const [variable2Type, setVariable2Type] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visualizationData, setVisualizationData] = useState<any>(null);
    const [uiMode, setUiMode] = useState<"dropdown" | "searchable">("dropdown");
    const [searchTerm1, setSearchTerm1] = useState("");
    const [searchTerm2, setSearchTerm2] = useState("");
    const [selectedGraphType, setSelectedGraphType] = useState<string>("scatter");

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

    // Update variable types when variables change
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

    // Use selected types instead of auto-detection
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
            const plotData = generateClientSideVisualization(variable1, variable2, mergedDatasetData, variable1Type, variable2Type, selectedGraphType);
            setVisualizationData(plotData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    // Accept explicit types
    const generateClientSideVisualization = (var1: string, var2: string, data: any[], type1: string, type2: string, graphType: string) => {
        // Filter data to only include rows where both variables have values
        const validData = data.filter(row =>
            row[var1] !== null && row[var1] !== undefined &&
            row[var2] !== null && row[var2] !== undefined
        );

        if (validData.length === 0) {
            throw new Error("No valid data points found for the selected variables");
        }

        // Use the selected graph type instead of auto-detection
        let chartType = graphType;

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

            case "hexbin":
                plotlyConfig = {
                    data: [{
                        x: validData.map(row => row[var1]),
                        y: validData.map(row => row[var2]),
                        type: "histogram2d",
                        colorscale: "Viridis",
                        nbinsx: 20,
                        nbinsy: 20
                    }],
                    layout: {
                        title: `${var1} vs ${var2} - 2D Histogram`,
                        xaxis: { title: var1 },
                        yaxis: { title: var2 },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            case "box":
                const categoricalVar = type1 === "categorical" ? var1 : var2;
                const numericalVar = type1 === "numerical" ? var1 : var2;
                const categories = [...new Set(validData.map(row => row[categoricalVar]))];

                plotlyConfig = {
                    data: categories.map(cat => ({
                        y: validData.filter(row => row[categoricalVar] === cat).map(row => row[numericalVar]),
                        type: "box",
                        name: cat,
                        boxpoints: "outliers"
                    })),
                    layout: {
                        title: `${numericalVar} by ${categoricalVar}`,
                        xaxis: { title: categoricalVar },
                        yaxis: { title: numericalVar },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            case "violin":
                const catVar = type1 === "categorical" ? var1 : var2;
                const numVar = type1 === "numerical" ? var1 : var2;
                const cats = [...new Set(validData.map(row => row[catVar]))];

                plotlyConfig = {
                    data: cats.map(cat => ({
                        y: validData.filter(row => row[catVar] === cat).map(row => row[numVar]),
                        type: "violin",
                        name: cat,
                        box: { visible: true },
                        line: { color: "black" }
                    })),
                    layout: {
                        title: `${numVar} by ${catVar}`,
                        xaxis: { title: catVar },
                        yaxis: { title: numVar },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            case "swarm":
                const catVarSwarm = type1 === "categorical" ? var1 : var2;
                const numVarSwarm = type1 === "numerical" ? var1 : var2;
                const catsSwarm = [...new Set(validData.map(row => row[catVarSwarm]))];

                plotlyConfig = {
                    data: catsSwarm.map(cat => ({
                        y: validData.filter(row => row[catVarSwarm] === cat).map(row => row[numVarSwarm]),
                        type: "scatter",
                        mode: "markers",
                        name: cat,
                        marker: { size: 6, opacity: 0.7 }
                    })),
                    layout: {
                        title: `${numVarSwarm} by ${catVarSwarm}`,
                        xaxis: { title: catVarSwarm },
                        yaxis: { title: numVarSwarm },
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

            case "area":
                const sortedAreaData = validData.sort((a, b) => {
                    const dateA = new Date(a[type1 === "datetime" ? var1 : var2]);
                    const dateB = new Date(b[type1 === "datetime" ? var1 : var2]);
                    return dateA.getTime() - dateB.getTime();
                });

                plotlyConfig = {
                    data: [{
                        x: sortedAreaData.map(row => row[type1 === "datetime" ? var1 : var2]),
                        y: sortedAreaData.map(row => row[type1 === "datetime" ? var2 : var1]),
                        type: "scatter",
                        mode: "lines",
                        fill: "tonexty",
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

            case "grouped_bar":
            case "stacked_bar":
            case "side_by_side":
                const categoricalVarBar = type1 === "categorical" ? var1 : var2;
                const numericalVarBar = type1 === "numerical" ? var1 : var2;

                const groupedData = validData.reduce((acc: any, row) => {
                    const category = row[categoricalVarBar];
                    if (!acc[category]) {
                        acc[category] = { sum: 0, count: 0 };
                    }
                    acc[category].sum += Number(row[numericalVarBar]) || 0;
                    acc[category].count += 1;
                    return acc;
                }, {});

                const categoriesBar = Object.keys(groupedData);
                const valuesBar = categoriesBar.map(cat => groupedData[cat].sum / groupedData[cat].count);

                plotlyConfig = {
                    data: [{
                        x: categoriesBar,
                        y: valuesBar,
                        type: "bar",
                        marker: {
                            color: "rgb(59, 130, 246)"
                        }
                    }],
                    layout: {
                        title: `${numericalVarBar} by ${categoricalVarBar}`,
                        xaxis: { title: categoricalVarBar },
                        yaxis: { title: `Average ${numericalVarBar}` },
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

            case "count":
                const countData = validData.reduce((acc: any, row) => {
                    const key = `${row[var1]} - ${row[var2]}`;
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});

                plotlyConfig = {
                    data: [{
                        x: Object.keys(countData),
                        y: Object.values(countData),
                        type: "bar",
                        marker: {
                            color: "rgb(59, 130, 246)"
                        }
                    }],
                    layout: {
                        title: `${var1} vs ${var2} - Count Plot`,
                        xaxis: { title: "Combination" },
                        yaxis: { title: "Count" },
                        height: 500,
                        margin: { t: 50, r: 50, b: 50, l: 50 }
                    }
                };
                break;

            case "step":
                const sortedStepData = validData.sort((a, b) => {
                    const dateA = new Date(a[type1 === "datetime" ? var1 : var2]);
                    const dateB = new Date(b[type1 === "datetime" ? var1 : var2]);
                    return dateA.getTime() - dateB.getTime();
                });

                plotlyConfig = {
                    data: [{
                        x: sortedStepData.map(row => row[type1 === "datetime" ? var1 : var2]),
                        y: sortedStepData.map(row => row[type1 === "datetime" ? var2 : var1]),
                        type: "scatter",
                        mode: "lines",
                        line: {
                            color: "rgb(59, 130, 246)",
                            shape: "hv" // Step shape
                        }
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
                // Fallback to scatter plot
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

    // Add this function to check compatibility
    const isGraphTypeCompatible = (graphType: GraphType, type1: string, type2: string): boolean => {
        return graphType.compatibleTypes.some(([t1, t2]) =>
            (t1 === type1 && t2 === type2) || (t1 === type2 && t2 === type1)
        );
    };

    // Add this function to get compatible graph types
    const getCompatibleGraphTypes = (type1: string, type2: string): GraphType[] => {
        return GRAPH_TYPES.filter(graphType => isGraphTypeCompatible(graphType, type1, type2));
    };

    // Add this function to auto-select appropriate graph type when variables change
    useEffect(() => {
        if (variable1Type && variable2Type) {
            const compatibleTypes = getCompatibleGraphTypes(variable1Type, variable2Type);
            if (compatibleTypes.length > 0) {
                // Auto-select the first compatible type, or keep current if still compatible
                const isCurrentCompatible = compatibleTypes.some(gt => gt.id === selectedGraphType);
                if (!isCurrentCompatible) {
                    setSelectedGraphType(compatibleTypes[0].id);
                }
            }
        }
    }, [variable1Type, variable2Type, selectedGraphType]);

    // Add this function to render the graph type selection section
    const renderGraphTypeSelection = () => {
        if (!variable1Type || !variable2Type) {
            return null;
        }

        const compatibleTypes = getCompatibleGraphTypes(variable1Type, variable2Type);

        if (compatibleTypes.length === 0) {
            return (
                <div className="w-full max-w-[160px]">
                    <div className="text-center p-3 text-sm text-muted-foreground bg-muted/30 rounded-md">
                        No compatible graph types for {variable1Type} vs {variable2Type}
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full max-w-[160px]">
                <Label className="text-sm font-medium mb-3 block">Graph Type</Label>
                <TooltipProvider>
                    <div className="grid grid-cols-2 gap-2">
                        {GRAPH_TYPES.map((graphType) => {
                            const isCompatible = isGraphTypeCompatible(graphType, variable1Type, variable2Type);
                            const isSelected = selectedGraphType === graphType.id;
                            const IconComponent = graphType.icon;

                            if (!isCompatible) {
                                return null; // Hide incompatible types
                            }

                            return (
                                <Tooltip key={graphType.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setSelectedGraphType(graphType.id)}
                                            className={`
                                                p-2 rounded-md border transition-all duration-200
                                                ${isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-background hover:bg-accent border-border hover:border-primary/50'
                                                }
                                                ${!isCompatible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                            disabled={!isCompatible}
                                        >
                                            <IconComponent className="h-4 w-4 mx-auto" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <div className="text-center">
                                            <p className="font-medium">{graphType.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {graphType.description}
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </div>
        );
    };

    // Render variable selection section
    const renderVariableSection = (
        variable: string,
        setVariable: (value: string) => void,
        variableType: string,
        setVariableType: (value: string) => void,
        searchTerm: string,
        setSearchTerm: (value: string) => void,
        label: string
    ) => {
        // Get the selected attribute details for display
        const selectedAttribute = getAvailableAttributes.find(attr => attr.name === variable);
        const displayName = selectedAttribute?.label || variable;

        return (
            <div className="flex flex-col space-y-3 w-full">
                <Label className="text-sm font-medium truncate">{label}</Label>

                {/* Attribute Selection */}
                {uiMode === "searchable" ? (
                    <div className="relative w-full max-w-[160px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${label.toLowerCase()}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-sm w-full"
                        />
                        {searchTerm && (
                            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50 w-full max-w-[160px]">
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
                                            <span className="font-medium text-sm truncate flex-1">{attr.label}</span>
                                            <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                                                {attr.type}
                                            </Badge>
                                        </div>
                                        {attr.description && attr.description.trim() && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {attr.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full max-w-[160px]">
                        <Select value={variable} onValueChange={(value) => {
                            setVariable(value);
                            const attr = getAvailableAttributes.find(attr => attr.name === value);
                            setVariableType(attr?.type || "");
                        }}>
                            <SelectTrigger className="text-sm w-full">
                                <SelectValue
                                    placeholder={`Select ${label.toLowerCase()}`}
                                    className="truncate"
                                >
                                    {variable && (
                                        <span className="truncate" title={displayName}>
                                            {displayName}
                                        </span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-60 w-[160px]">
                                {getAvailableAttributes.map((attr) => (
                                    <SelectItem key={attr.name} value={attr.name} className="text-sm">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-medium truncate flex-1">{attr.label}</span>
                                            <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                                                {attr.type}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Type Indicator Bar - Read-only display */}
                <div className="w-full max-w-[160px]">
                    <div className="flex items-center justify-between px-3 py-2 text-sm bg-muted/50 border border-border rounded-md">
                        <span className="font-medium text-muted-foreground">Type:</span>
                        <Badge
                            variant="outline"
                            className="text-xs font-medium"
                        >
                            {variableType || "Not selected"}
                        </Badge>
                    </div>
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

    // ✅ REFINED: Enhanced dropdown display with read-only type indicators
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    Variable Selection
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 overflow-x-hidden">
                {/* UI Mode Toggle */}
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Selection Mode</Label>
                    <div className="flex gap-2">
                        <Button
                            variant={uiMode === "dropdown" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUiMode("dropdown")}
                            className="text-sm"
                        >
                            Dropdown
                        </Button>
                        <Button
                            variant={uiMode === "searchable" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUiMode("searchable")}
                            className="text-sm"
                        >
                            Searchable
                        </Button>
                    </div>
                </div>

                {/* Side-by-side variable selection with read-only type indicators */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Variable A */}
                    <div className="flex justify-center">
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
                    <div className="flex justify-center">
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

                {/* ✅ NEW: Graph Type Selection Section */}
                <div className="flex justify-center">
                    {renderGraphTypeSelection()}
                </div>

                {/* Generate Graph Button */}
                <div className="flex justify-center pt-2">
                    <Button
                        onClick={handleGenerateGraph}
                        disabled={!variable1 || !variable2 || isGenerating || mergedDatasetData.length === 0}
                        className="flex items-center gap-2 px-8 py-2 text-sm"
                        size="default"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <BarChart3 className="h-4 w-4" />
                                Generate Graph
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}; 