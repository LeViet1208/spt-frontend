"use client";

import { useState, useEffect, useCallback } from "react";
import { datasetAPI, type Dataset } from "@/utils/api/dataset";

export interface CreateDatasetRequest {
	name: string;
	description?: string;
	files: {
		transaction: File;
		product_lookup: File;
		causal_lookup: File;
	};
}

export interface CreateDatasetProgress {
	step:
		| "creating_master"
		| "uploading_transaction"
		| "uploading_product_lookup"
		| "uploading_causal_lookup"
		| "completed";
	progress: number;
	message: string;
}

export function useDatasets() {
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch datasets
	const fetchDatasets = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await datasetAPI.getDatasets();

			if (response.success && response.data) {
				setDatasets(response.data);
			} else {
				setError(response.error || "Failed to fetch datasets");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error("Error in fetchDatasets:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	// Create new dataset with 4-step process
	const createDataset = useCallback(
		async (
			request: CreateDatasetRequest,
			onProgress?: (progress: CreateDatasetProgress) => void
		) => {
			try {
				// Step 1: Create dataset master
				onProgress?.({
					step: "creating_master",
					progress: 10,
					message: "Creating dataset...",
				});

				const masterResponse = await datasetAPI.createDatasetMaster({
					name: request.name,
					description: request.description,
				});

				if (!masterResponse.success || !masterResponse.data) {
					return {
						success: false,
						error: masterResponse.error || "Failed to create dataset master",
					};
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

				const transactionResponse = await datasetAPI.uploadTransactionFile({
					datasetId,
					file: request.files.transaction,
					fileType: "transaction",
				});

				if (!transactionResponse.success) {
					return {
						success: false,
						error:
							transactionResponse.error || "Failed to upload transaction file",
					};
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

				const productResponse = await datasetAPI.uploadProductLookupFile({
					datasetId,
					file: request.files.product_lookup,
					fileType: "product_lookup",
				});

				if (!productResponse.success) {
					return {
						success: false,
						error:
							productResponse.error || "Failed to upload product lookup file",
					};
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

				const causalResponse = await datasetAPI.uploadCausalLookupFile({
					datasetId,
					file: request.files.causal_lookup,
					fileType: "causal_lookup",
				});

				if (!causalResponse.success) {
					return {
						success: false,
						error:
							causalResponse.error || "Failed to upload causal lookup file",
					};
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

				return { success: true, data: dataset };
			} catch (err) {
				console.error("Error in createDataset:", err);
				return { success: false, error: "An unexpected error occurred" };
			}
		},
		[]
	);

	// Delete dataset
	const deleteDataset = useCallback(async (id: number) => {
		try {
			const response = await datasetAPI.deleteDataset(id);

			if (response.success) {
				// Remove dataset from the list
				setDatasets((prev) => prev.filter((dataset) => dataset.id !== id));
				return { success: true };
			} else {
				return {
					success: false,
					error: response.error || "Failed to delete dataset",
				};
			}
		} catch (err) {
			console.error("Error in deleteDataset:", err);
			return { success: false, error: "An unexpected error occurred" };
		}
	}, []);

	// Refresh datasets
	const refreshDatasets = useCallback(() => {
		fetchDatasets();
	}, [fetchDatasets]);

	// Initial fetch
	useEffect(() => {
		fetchDatasets();
	}, [fetchDatasets]);

	return {
		datasets,
		loading,
		error,
		createDataset,
		deleteDataset,
		refreshDatasets,
		refetch: fetchDatasets,
	};
}
