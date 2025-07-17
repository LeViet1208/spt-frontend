"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { datasetService } from "@/utils/services/dataset";
import { 
    MergedVariablesResponse, 
    MergedVisualizationRequest, 
    MergedVisualizationPayload,
    MergedVariable 
} from "@/utils/types/dataset";
import { validateVariableName, createVariableInfo, isMergedVariable } from "@/utils/validation";

export const useMergedVisualization = (datasetId: string) => {
    const { showErrorNotification } = useNotifications();
    
    const [availableVariables, setAvailableVariables] = useState<MergedVariablesResponse | null>(null);
    const [isLoadingVariables, setIsLoadingVariables] = useState(false);
    const [variablesError, setVariablesError] = useState<string | null>(null);
    const [visualizationData, setVisualizationData] = useState<MergedVisualizationPayload | null>(null);
    const [isLoadingVisualization, setIsLoadingVisualization] = useState(false);
    const [visualizationError, setVisualizationError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load available variables
    useEffect(() => {
        const loadVariables = async () => {
            if (!datasetId) return;

            setIsLoadingVariables(true);
            setVariablesError(null);

            try {
                const result = await datasetService.getMergedVariables();
                
                if (result.success && result.data) {
                    setAvailableVariables(result.data);
                } else {
                    const errorMessage = result.error || "Failed to load variables";
                    setVariablesError(errorMessage);
                    showErrorNotification(errorMessage);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
                setVariablesError(errorMessage);
                showErrorNotification(errorMessage);
            } finally {
                setIsLoadingVariables(false);
            }
        };

        loadVariables();
    }, [datasetId, showErrorNotification]);

    // Fetch available variables (for backward compatibility)
    const fetchAvailableVariables = useCallback(async () => {
        if (!datasetId) return;

        setIsLoadingVariables(true);
        setError(null);

        try {
            const result = await datasetService.getMergedVariables();
            
            if (result.success && result.data) {
                setAvailableVariables(result.data);
            } else {
                const errorMessage = result.error || "Failed to fetch available variables";
                setError(errorMessage);
                showErrorNotification(errorMessage);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch available variables";
            setError(errorMessage);
            showErrorNotification(errorMessage);
        } finally {
            setIsLoadingVariables(false);
        }
    }, [datasetId, showErrorNotification]);

    // Fetch merged visualization (for backward compatibility)
    const fetchMergedVisualization = useCallback(async (request: MergedVisualizationRequest) => {
        if (!datasetId) {
            setError("Dataset ID is required");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log("Sending merged visualization request:", request);
            const result = await datasetService.getMergedVisualization(datasetId, request);
            
            if (result.success && result.data) {
                console.log("Merged visualization response:", result.data);
                setVisualizationData(result.data);
            } else {
                const errorMessage = result.error || "Failed to fetch merged visualization";
                console.error("Merged visualization error:", errorMessage);
                setError(errorMessage);
                showErrorNotification(errorMessage);
                setVisualizationData(null);
            }
        } catch (err) {
            console.error("Merged visualization exception:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch merged visualization";
            setError(errorMessage);
            showErrorNotification(errorMessage);
            setVisualizationData(null);
        } finally {
            setIsLoading(false);
        }
    }, [datasetId, showErrorNotification]);

    // Generate visualization
    const generateVisualization = useCallback(async (request: MergedVisualizationRequest) => {
        if (!datasetId) return;

        setIsLoadingVisualization(true);
        setVisualizationError(null);

        try {
            const result = await datasetService.getMergedVisualization(datasetId, request);
            
            if (result.success && result.data) {
                setVisualizationData(result.data);
            } else {
                setVisualizationError(result.error || "Failed to generate visualization");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setVisualizationError(errorMessage);
        } finally {
            setIsLoadingVisualization(false);
        }
    }, [datasetId]);

    // Get variables by type with proper filtering
    const getVariablesByType = useCallback((type: "numerical" | "categorical" | "datetime"): MergedVariable[] => {
        if (!availableVariables) return [];
        
        const typeVariables = availableVariables.types[type] || [];
        
        return typeVariables
            .filter(varName => varName && varName.trim() !== "")
            .map(varName => {
                const variable = availableVariables.variables[type][varName];
                if (!variable) return null;
                
                // Create a properly typed MergedVariable object
                const mergedVariable: MergedVariable = {
                    name: variable.name || varName,
                    type: variable.type,
                    description: variable.description || "",
                    source_table: variable.source_table || "",
                    high_cardinality: variable.high_cardinality || false,
                    join_key: variable.join_key || false,
                    ...(variable.unique_count !== undefined && { unique_count: variable.unique_count }),
                    ...(variable.min !== undefined && { min: variable.min }),
                    ...(variable.max !== undefined && { max: variable.max }),
                    ...(variable.mean !== undefined && { mean: variable.mean }),
                    ...(variable.median !== undefined && { median: variable.median }),
                    ...(variable.std !== undefined && { std: variable.std })
                };
                
                return mergedVariable;
            })
            .filter((variable): variable is MergedVariable => variable !== null);
    }, [availableVariables]);

    const clearError = useCallback(() => {
        setError(null);
        setVisualizationError(null);
    }, []);
    
    const resetState = useCallback(() => {
        setVisualizationData(null);
        setError(null);
        setVisualizationError(null);
    }, []);
    
    // Helper functions for variable selection with improved type safety
    const getVariableInfo = useCallback((variableName: string): MergedVariable | null => {
        if (!availableVariables || !validateVariableName(variableName)) {
            return null;
        }
        
        // Check in all variable types
        for (const type of ['numerical', 'categorical', 'datetime'] as const) {
            const variableInfo = availableVariables.variables[type]?.[variableName];
            if (variableInfo) {
                // Create a properly typed MergedVariable object
                const mergedVariable: MergedVariable = {
                    name: variableInfo.name || variableName,
                    type: variableInfo.type,
                    description: variableInfo.description || "",
                    source_table: variableInfo.source_table || "",
                    high_cardinality: variableInfo.high_cardinality || false,
                    join_key: variableInfo.join_key || false,
                    ...(variableInfo.unique_count !== undefined && { unique_count: variableInfo.unique_count }),
                    ...(variableInfo.min !== undefined && { min: variableInfo.min }),
                    ...(variableInfo.max !== undefined && { max: variableInfo.max }),
                    ...(variableInfo.mean !== undefined && { mean: variableInfo.mean }),
                    ...(variableInfo.median !== undefined && { median: variableInfo.median }),
                    ...(variableInfo.std !== undefined && { std: variableInfo.std })
                };
                
                return mergedVariable;
            }
        }
        
        return null;
    }, [availableVariables]);
    
    return {
        // State
        visualizationData,
        availableVariables,
        isLoading,
        isLoadingVariables,
        error,
        isLoadingVisualization,
        visualizationError,
        
        // Actions
        fetchMergedVisualization,
        fetchAvailableVariables,
        generateVisualization,
        clearError,
        resetState,
        
        // Helpers
        getVariablesByType,
        getVariableInfo,
    };
};