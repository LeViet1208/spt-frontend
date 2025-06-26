"use client";

import { useState, useCallback } from "react";
import { AxiosError } from "axios";
import { useToast } from "@/hooks/useToast";
import { datasetService } from "@/utils/services/dataset";
import {
	Dataset,
	CreateDatasetRequest,
	CreateDatasetProgress,
} from "@/utils/types/dataset";

export type { CreateDatasetProgress };

export const useDataset = () => {
	const { showSuccessToast, showErrorToast } = useToast();

	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleError = useCallback(
		(err: unknown, defaultMessage: string) => {
			console.error(err);
			const axiosError = err as AxiosError<{ message?: string }>;
			const message = axiosError?.response?.data?.message || defaultMessage;
			setError(message);
			showErrorToast(message);
		},
		[showErrorToast]
	);

	const fetchDatasets = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await datasetService.getDatasets();
			if (response.success && response.data) {
				setDatasets(response.data);
			} else {
				handleError(
					new Error(response.error),
					response.error || "Failed to fetch datasets"
				);
			}
		} catch (err) {
			handleError(err, "Failed to fetch datasets");
		} finally {
			setIsLoading(false);
		}
	}, [handleError]);

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
					handleError(
						new Error(response.error),
						response.error || "Failed to fetch dataset"
					);
					return null;
				}
			} catch (err) {
				handleError(err, "Failed to fetch dataset");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleError]
	);

	const createDataset = useCallback(
		async (
			request: CreateDatasetRequest,
			onProgress?: (progress: CreateDatasetProgress) => void
		) => {
			setIsLoading(true);
			setError(null);
			try {
				// Step 1: Create dataset master
				onProgress?.({
					step: "creating_master",
					progress: 10,
					message: "Creating dataset...",
				});

				const masterResponse = await datasetService.createDatasetMaster({
					name: request.name,
					description: request.description,
				});

				if (!masterResponse.success || !masterResponse.data) {
					handleError(
						new Error(masterResponse.error),
						masterResponse.error || "Failed to create dataset master"
					);
					return null;
				}

				const { datasetId, dataset } = masterResponse.data;

				// Add new dataset to the list immediately
				setDatasets((prev) => [dataset, ...prev]);

				// Step 2: Upload transaction file
				onProgress?.({
					step: "uploading_transaction",
					progress: 25,
					message: "Uploading transaction file...",
				});

				const transactionResponse = await datasetService.uploadTransactionFile({
					datasetId,
					file: request.files.transaction,
					fileType: "transaction",
				});

				if (!transactionResponse.success) {
					handleError(
						new Error(transactionResponse.error),
						transactionResponse.error || "Failed to upload transaction file"
					);
					return null;
				}

				// Update dataset status
				setDatasets((prev) =>
					prev.map((d) =>
						d.id === datasetId
							? { ...d, importStatus: "importing_product_lookup" as const }
							: d
					)
				);

				// Step 3: Upload product lookup file
				onProgress?.({
					step: "uploading_product_lookup",
					progress: 50,
					message: "Uploading product lookup file...",
				});

				const productResponse = await datasetService.uploadProductLookupFile({
					datasetId,
					file: request.files.product_lookup,
					fileType: "product_lookup",
				});

				if (!productResponse.success) {
					handleError(
						new Error(productResponse.error),
						productResponse.error || "Failed to upload product lookup file"
					);
					return null;
				}

				// Update dataset status
				setDatasets((prev) =>
					prev.map((d) =>
						d.id === datasetId
							? { ...d, importStatus: "importing_causal_lookup" as const }
							: d
					)
				);

				// Step 4: Upload causal lookup file
				onProgress?.({
					step: "uploading_causal_lookup",
					progress: 75,
					message: "Uploading causal lookup file...",
				});

				const causalResponse = await datasetService.uploadCausalLookupFile({
					datasetId,
					file: request.files.causal_lookup,
					fileType: "causal_lookup",
				});

				if (!causalResponse.success) {
					handleError(
						new Error(causalResponse.error),
						causalResponse.error || "Failed to upload causal lookup file"
					);
					return null;
				}

				// Final update - mark as completed
				setDatasets((prev) =>
					prev.map((d) =>
						d.id === datasetId
							? { ...d, importStatus: "import_completed" as const }
							: d
					)
				);

				onProgress?.({
					step: "completed",
					progress: 100,
					message: "Dataset created successfully!",
				});

				showSuccessToast("Dataset created successfully!");
				return dataset;
			} catch (err) {
				handleError(err, "Failed to create dataset");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleError, showSuccessToast]
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
					showSuccessToast("Dataset deleted successfully!");
					return true;
				} else {
					handleError(
						new Error(response.error),
						response.error || "Failed to delete dataset"
					);
					return false;
				}
			} catch (err) {
				handleError(err, "Failed to delete dataset");
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[handleError, showSuccessToast, currentDataset]
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
