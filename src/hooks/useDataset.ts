"use client";

import { useState, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { datasetService } from "@/utils/services/dataset";
import { handleError } from "@/utils/errorHandler";
import { Dataset, CreateDatasetRequest } from "@/utils/types/dataset";

export const useDataset = () => {
	const { showSuccessNotification } = useNotifications();

	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDatasetError = useCallback(
		(err: unknown, defaultMessage: string, context?: string) => {
			console.error(`Dataset ${context || "operation"} error:`, err);

			// Use the centralized error handler
			const processedError = handleError(err, context, {
				defaultMessage,
			});

			setError(processedError.userMessage);
		},
		[]
	);

	const fetchDatasets = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await datasetService.getDatasets();
			if (response.success && response.data) {
				setDatasets(response.data);
			} else {
				handleDatasetError(
					new Error(response.error || "Failed to fetch datasets"),
					response.error || "Failed to fetch datasets",
					"fetch-datasets-response"
				);
			}
		} catch (err) {
			handleDatasetError(err, "Failed to fetch datasets", "fetch-datasets");
		} finally {
			setIsLoading(false);
		}
	}, [handleDatasetError]);

	const fetchDataset = useCallback(
		async (id: number) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await datasetService.getDatasetById(id);
				if (response.success && response.data) {
					setCurrentDataset(response.data);
					return response.data;
				} else {
					handleDatasetError(
						new Error(response.error || "Failed to fetch dataset"),
						response.error || "Failed to fetch dataset",
						"fetch-dataset-response"
					);
					return null;
				}
			} catch (err) {
				handleDatasetError(err, "Failed to fetch dataset", "fetch-dataset");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleDatasetError]
	);

	const createDataset = useCallback(
		async (request: CreateDatasetRequest) => {
			setIsLoading(true);
			setError(null);
			try {
				// Step 1: Create dataset master
				const masterResponse = await datasetService.createDatasetMaster({
					name: request.name,
					description: request.description,
				});

				if (!masterResponse.data) {
					handleDatasetError(
						new Error("Failed to create dataset master"),
						"Failed to create dataset master",
						"create-dataset-master"
					);
					return null;
				}

				const { datasetId, dataset } = masterResponse.data;

				// Add new dataset to the list immediately with uploading status
				setDatasets((prev) => [{ ...dataset, status: "uploading" }, ...prev]);

				// Upload all files
				const transactionResponse = await datasetService.uploadTransactionFile({
					datasetId,
					file: request.files.transaction,
					fileType: "transaction",
				});

				if (!transactionResponse.success) {
					handleDatasetError(
						new Error(
							transactionResponse.error || "Failed to upload transaction file"
						),
						transactionResponse.error || "Failed to upload transaction file",
						"upload-transaction"
					);
					return null;
				}

				const productResponse = await datasetService.uploadProductLookupFile({
					datasetId,
					file: request.files.product_lookup,
					fileType: "product_lookup",
				});

				if (!productResponse.success) {
					handleDatasetError(
						new Error(
							productResponse.error || "Failed to upload product lookup file"
						),
						productResponse.error || "Failed to upload product lookup file",
						"upload-product-lookup"
					);
					return null;
				}

				const causalResponse = await datasetService.uploadCausalLookupFile({
					datasetId,
					file: request.files.causal_lookup,
					fileType: "causal_lookup",
				});

				if (!causalResponse.success) {
					handleDatasetError(
						new Error(
							causalResponse.error || "Failed to upload causal lookup file"
						),
						causalResponse.error || "Failed to upload causal lookup file",
						"upload-causal-lookup"
					);
					return null;
				}

				// Update status to analyzing after all files are uploaded
				setDatasets((prev) =>
					prev.map((d) =>
						d.id === datasetId ? { ...d, status: "analyzing" as const } : d
					)
				);

				showSuccessNotification("Dataset created successfully!");
				return { ...dataset, status: "analyzing" as const };
			} catch (err) {
				handleDatasetError(err, "Failed to create dataset", "create-dataset");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleDatasetError, showSuccessNotification]
	);

	const deleteDataset = useCallback(
		async (id: number) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await datasetService.deleteDataset(id);
				if (response.success) {
					setDatasets((prev) => prev.filter((dataset) => dataset.id !== id));
					if (currentDataset?.id === id) {
						setCurrentDataset(null);
					}
					showSuccessNotification("Dataset deleted successfully!");
					return true;
				} else {
					handleDatasetError(
						new Error(response.error || "Failed to delete dataset"),
						response.error || "Failed to delete dataset",
						"delete-dataset"
					);
					return false;
				}
			} catch (err) {
				handleDatasetError(err, "Failed to delete dataset", "delete-dataset");
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[handleDatasetError, showSuccessNotification, currentDataset]
	);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const resetState = useCallback(() => {
		setDatasets([]);
		setCurrentDataset(null);
		setError(null);
	}, []);

	return {
		// State
		datasets,
		currentDataset,
		isLoading,
		error,

		// Methods
		fetchDatasets,
		fetchDataset,
		createDataset,
		deleteDataset,

		// Utility methods
		clearError,
		resetState,
	};
};
