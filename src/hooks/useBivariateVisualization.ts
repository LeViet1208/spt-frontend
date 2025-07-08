"use client";

import { useState, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { datasetService } from "@/utils/services/dataset";
import {
	BivariateVisualizationPayload,
	BivariateVisualizationRequest,
} from "@/utils/types/dataset";

export const useBivariateVisualization = (datasetId?: string) => {
	const { showErrorNotification } = useNotifications();

	const [visualizationData, setVisualizationData] =
		useState<BivariateVisualizationPayload | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch bivariate visualization data
	const fetchBivariateVisualization = useCallback(
		async (request: BivariateVisualizationRequest) => {
			if (!datasetId) {
				setError("Dataset ID is required");
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = await datasetService.getBivariateVisualization(
					datasetId,
					request.table1,
					request.variable1,
					request.table2,
					request.variable2
				);

				if (response.success && response.data) {
					setVisualizationData(response.data);
				} else {
					const errorMessage =
						response.error || "Failed to fetch bivariate visualization";
					setError(errorMessage);
					showErrorNotification(errorMessage);
					setVisualizationData(null);
				}
			} catch (err) {
				const errorMessage = "Failed to fetch bivariate visualization";
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
		isLoading,
		error,

		// Actions
		fetchBivariateVisualization,
		clearError,
		resetState,
	};
};
