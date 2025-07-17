"use client";

import { useState, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { datasetService } from "@/utils/services/dataset";
import {
    MergedVisualizationRequest,
    MergedVisualizationPayload,
    EnhancedMergedVariablesResponse,
    MeaningfulPair,
} from "@/utils/types/dataset";

export const useEnhancedBivariateVisualization = (datasetId?: string) => {
    const { showErrorNotification } = useNotifications();

    const [visualizationData, setVisualizationData] = useState<MergedVisualizationPayload | null>(null);
    const [availableVariables, setAvailableVariables] = useState<EnhancedMergedVariablesResponse | null>(null);
    const [meaningfulPairs, setMeaningfulPairs] = useState<MeaningfulPair[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingVariables, setIsLoadingVariables] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available variables with enhanced metadata
    const fetchAvailableVariables = useCallback(async () => {
        if (!datasetId) {
            setError("Dataset ID is required");
            return;
        }

        setIsLoadingVariables(true);
        setError(null);

        try {
            const response = await datasetService.getEnhancedMergedVariables(datasetId);
            
            if (response.success && response.data) {
                setAvailableVariables(response.data);
                setMeaningfulPairs(response.data.meaningful_pairs || []);
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
    }, [datasetId, showErrorNotification]);

    // Fetch enhanced visualization data
    const fetchEnhancedVisualization = useCallback(
        async (request: MergedVisualizationRequest) => {
            if (!datasetId) {
                setError("Dataset ID is required");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await datasetService.getEnhancedMergedVisualization(
                    datasetId,
                    request
                );

                if (response.success && response.data) {
                    setVisualizationData(response.data);
                } else {
                    const errorMessage = response.error || "Failed to fetch enhanced visualization";
                    setError(errorMessage);
                    showErrorNotification(errorMessage);
                    setVisualizationData(null);
                }
            } catch (err) {
                const errorMessage = "Failed to fetch enhanced visualization";
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

    return {
        // State
        visualizationData,
        availableVariables,
        meaningfulPairs,
        isLoading,
        isLoadingVariables,
        error,

        // Actions
        fetchEnhancedVisualization,
        fetchAvailableVariables,
        clearError,
        resetState,
    };
}; 