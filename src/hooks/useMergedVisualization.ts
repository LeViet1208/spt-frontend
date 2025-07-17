 "use client";

import { useState, useCallback, useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { datasetService } from "@/utils/services/dataset";
import {
    MergedVisualizationPayload,
    MergedVisualizationRequest,
    MergedVariablesResponse,
    MergedVariable,
} from "@/utils/types/dataset";

export const useMergedVisualization = (datasetId?: string) => {
    const { showErrorNotification } = useNotifications();
    
    const [visualizationData, setVisualizationData] = 
        useState<MergedVisualizationPayload | null>(null);
    const [availableVariables, setAvailableVariables] = 
        useState<MergedVariablesResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingVariables, setIsLoadingVariables] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Fetch available variables
    const fetchAvailableVariables = useCallback(async () => {
        setIsLoadingVariables(true);
        setError(null);
        
        try {
            const response = await datasetService.getMergedVariables();
            
            if (response.success && response.data) {
                setAvailableVariables(response.data);
            } else {
                const errorMessage = response.error || "Failed to fetch available variables";
                setError(errorMessage);
                showErrorNotification(errorMessage);
            }
        } catch (err) {
            const errorMessage = "Failed to fetch available variables";
            setError(errorMessage);
            showErrorNotification(errorMessage);
        } finally {
            setIsLoadingVariables(false);
        }
    }, [showErrorNotification]);
    
    // Fetch merged visualization data
    const fetchMergedVisualization = useCallback(
        async (request: MergedVisualizationRequest) => {
            if (!datasetId) {
                setError("Dataset ID is required");
                return;
            }
            
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await datasetService.getMergedVisualization(
                    datasetId,
                    request
                );
                
                if (response.success && response.data) {
                    setVisualizationData(response.data);
                } else {
                    const errorMessage = response.error || "Failed to fetch merged visualization";
                    setError(errorMessage);
                    showErrorNotification(errorMessage);
                    setVisualizationData(null);
                }
            } catch (err) {
                const errorMessage = "Failed to fetch merged visualization";
                setError(errorMessage);
                showErrorNotification(errorMessage);
                setVisualizationData(null);
            } finally {
                setIsLoading(false);
            }
        },
        [datasetId, showErrorNotification]
    );
    
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    
    const resetState = useCallback(() => {
        setVisualizationData(null);
        setError(null);
    }, []);
    
    // Helper functions for variable selection
    const getVariablesByType = useCallback((type: "numerical" | "categorical" | "datetime") => {
        if (!availableVariables) return [];
        
        return availableVariables.types[type].map(varName => ({
            name: varName,
            ...availableVariables.variables[varName]
        }));
    }, [availableVariables]);
    
    const getVariableInfo = useCallback((variableName: string): MergedVariable | null => {
        if (!availableVariables || !availableVariables.variables[variableName]) {
            return null;
        }
        
        return {
            name: variableName,
            ...availableVariables.variables[variableName]
        };
    }, [availableVariables]);
    
    return {
        // State
        visualizationData,
        availableVariables,
        isLoading,
        isLoadingVariables,
        error,
        
        // Actions
        fetchMergedVisualization,
        fetchAvailableVariables,
        clearError,
        resetState,
        
        // Helpers
        getVariablesByType,
        getVariableInfo,
    };
};