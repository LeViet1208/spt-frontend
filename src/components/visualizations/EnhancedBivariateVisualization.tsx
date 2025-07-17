"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, TrendingUp, BarChart3, ScatterChart } from "lucide-react";
import { datasetService } from "@/utils/services/dataset";
import { EnhancedMergedVariablesResponse, MergedVariable, MeaningfulPair } from "@/utils/types/dataset";

interface EnhancedBivariateVisualizationProps {
    datasetId: string;
}

export const EnhancedBivariateVisualization: React.FC<EnhancedBivariateVisualizationProps> = ({
    datasetId,
}) => {
    const [availableVariables, setAvailableVariables] = useState<EnhancedMergedVariablesResponse | null>(null);
    const [variable1, setVariable1] = useState<string>("");
    const [variable2, setVariable2] = useState<string>("");
    const [chartType, setChartType] = useState<string>("scatter");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPair, setSelectedPair] = useState<MeaningfulPair | null>(null);

    // Load available variables
    useEffect(() => {
        const loadVariables = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await datasetService.getEnhancedMergedVariables(datasetId);

                if (result.success && result.data) {
                    setAvailableVariables(result.data);

                    // Set default variables if available
                    if (result.data.variables.numerical && Object.keys(result.data.variables.numerical).length > 0) {
                        const firstNumerical = Object.keys(result.data.variables.numerical)[0];
                        setVariable1(firstNumerical);
                    }

                    if (result.data.variables.categorical && Object.keys(result.data.variables.categorical).length > 0) {
                        const firstCategorical = Object.keys(result.data.variables.categorical)[0];
                        setVariable2(firstCategorical);
                    }
                } else {
                    setError(result.error || "Failed to load variables");
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        if (datasetId) {
            loadVariables();
        }
    }, [datasetId]);

    // Get variable options with proper filtering
    const getVariableOptions = useMemo(() => {
        if (!availableVariables) return [];

        const allVariables = {
            ...availableVariables.variables.numerical,
            ...availableVariables.variables.categorical,
            ...availableVariables.variables.datetime
        };

        return Object.entries(allVariables)
            .filter(([name, variable]) =>
                name && name.trim() !== "" &&
                variable &&
                typeof variable === 'object' &&
                'name' in variable
            )
            .map(([name, variable]) => ({
                value: name,
                label: variable.name || name,
                type: variable.type,
                description: variable.description || "",
                sourceTable: variable.source_table || ""
            }));
    }, [availableVariables]);

    // Get chart type options
    const getChartTypeOptions = useMemo(() => {
        if (!variable1 || !variable2 || !availableVariables) return [];

        const var1 = availableVariables.variables.all[variable1];
        const var2 = availableVariables.variables.all[variable2];

        if (!var1 || !var2) return [];

        const type1 = var1.type;
        const type2 = var2.type;

        const chartOptions: { [key: string]: string[] } = {
            "numerical-numerical": ["scatter", "line", "heatmap", "box", "violin"],
            "categorical-numerical": ["bar", "box", "violin", "strip", "histogram"],
            "numerical-categorical": ["bar", "box", "violin", "strip", "histogram"],
            "categorical-categorical": ["heatmap", "bar", "stacked_bar", "grouped_bar"],
            "datetime-numerical": ["line", "scatter", "area", "bar"],
            "numerical-datetime": ["line", "scatter", "area", "bar"],
            "datetime-categorical": ["bar", "line", "heatmap"],
            "categorical-datetime": ["bar", "line", "heatmap"],
            "datetime-datetime": ["scatter", "line", "heatmap"]
        };

        const key = `${type1}-${type2}`;
        return chartOptions[key] || ["scatter"];
    }, [variable1, variable2, availableVariables]);

    // Handle pair selection
    const handlePairSelection = (pair: MeaningfulPair) => {
        setSelectedPair(pair);
        setVariable1(pair.variable1);
        setVariable2(pair.variable2);
    };

    // Render variable select component
    const renderVariableSelect = (
        value: string,
        onChange: (value: string) => void,
        placeholder: string,
        label: string
    ) => (
        <div className="space-y-2">
            <Label htmlFor={`${label.toLowerCase()}-select`}>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={`${label.toLowerCase()}-select`}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {getVariableOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">
                                    {option.type} • {option.sourceTable}
                                </span>
                            </div>
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
                        <span className="ml-2">Loading variables...</span>
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
                    Enhanced Bivariate Visualization
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Meaningful Pairs Section */}
                {availableVariables?.meaningful_pairs && availableVariables.meaningful_pairs.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <Label className="text-sm font-medium">Recommended Pairs</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {availableVariables.meaningful_pairs.map((pair, index) => (
                                <Button
                                    key={`${pair.variable1}-${pair.variable2}`}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePairSelection(pair)}
                                    className="justify-start text-left h-auto p-3"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-xs">
                                            {pair.variable1} × {pair.variable2}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {pair.category} • {Math.round(pair.confidence * 100)}% confidence
                                        </span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Variable Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderVariableSelect(
                        variable1,
                        setVariable1,
                        "Select first variable",
                        "Variable 1"
                    )}
                    {renderVariableSelect(
                        variable2,
                        setVariable2,
                        "Select second variable",
                        "Variable 2"
                    )}
                </div>

                {/* Chart Type Selection */}
                {variable1 && variable2 && (
                    <div className="space-y-2">
                        <Label htmlFor="chart-type-select">Chart Type</Label>
                        <Select value={chartType} onValueChange={setChartType}>
                            <SelectTrigger id="chart-type-select">
                                <SelectValue placeholder="Select chart type" />
                            </SelectTrigger>
                            <SelectContent>
                                {getChartTypeOptions.map((chartTypeOption) => (
                                    <SelectItem key={chartTypeOption} value={chartTypeOption}>
                                        {chartTypeOption.charAt(0).toUpperCase() + chartTypeOption.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Variable Information */}
                {variable1 && variable2 && availableVariables && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[variable1, variable2].map((varName) => {
                            const variable = availableVariables.variables.all[varName];
                            if (!variable) return null;

                            return (
                                <Card key={varName} className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">{variable.name}</h4>
                                            <Badge variant="secondary">{variable.type}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {variable.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Source: {variable.source_table}</span>
                                            {variable.high_cardinality && (
                                                <Badge variant="outline" className="text-xs">
                                                    High Cardinality
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Visualization Placeholder */}
                {variable1 && variable2 && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <ScatterChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Visualization will be rendered here for {variable1} vs {variable2}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Chart type: {chartType}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 