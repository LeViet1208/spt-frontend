import { apiGet, apiPost } from "@/utils/api";
import { auth } from "@/utils/firebase";
import { ApiResult, isApiSuccess } from "@/utils/types/api";
import { handleApiError } from "@/utils/errorHandler";
import {
	Dataset,
	CreateDatasetMasterRequest,
	CreateDatasetMasterPayload,
	UploadFileRequest,
	UploadFilePayload,
	DatasetsListPayload,
	DatasetBackendResponse,
	VariableStats,
	DatasetAnalyticsPayload,
	BivariateVisualizationPayload,
} from "@/utils/types/dataset";

export const datasetService = {
	async getDatasets(): Promise<{
		success: boolean;
		data?: Dataset[];
		error?: string;
	}> {
		// Ensure user is authenticated before making API call
		await auth.authStateReady();
		const user = auth.currentUser;
		if (!user) {
			return {
				success: false,
				error: "User not authenticated",
			};
		}

		const result = await apiGet<DatasetsListPayload>(
			`/users/${user.uid}/datasets`
		);

		if (isApiSuccess(result)) {
			// Debug: Log the raw backend response
			console.log("Backend datasets response:", result.payload);

			// Transform backend response to match our Dataset interface
			const transformedDatasets: Dataset[] =
				result.payload.datasets?.map((dataset: DatasetBackendResponse) => {
					// Debug: Log each dataset transformation
					console.log(`Transforming dataset ${dataset.dataset_id}:`, dataset);

					const transformed = {
						id: dataset.dataset_id,
						name: dataset.name || `Dataset ${dataset.dataset_id}`,
						description: dataset.description,
						createdAt: new Date(dataset.created_at * 1000).toISOString(),
						updatedAt: new Date(dataset.created_at * 1000).toISOString(),
						status: dataset.status || "uploading", // Use simplified status from backend
					};

					console.log(
						`Transformed dataset ${dataset.dataset_id}:`,
						transformed
					);
					return transformed;
				}) || [];

			console.log("All transformed datasets:", transformedDatasets);
			console.log(
				"Completed datasets:",
				transformedDatasets.filter((d) => d.status === "completed")
			);

			return {
				success: true,
				data: transformedDatasets,
			};
		} else {
			// Error handling is already done by the error handler
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async createDatasetMaster(request: CreateDatasetMasterRequest): Promise<{
		success: boolean;
		data?: { datasetId: number; dataset: Dataset };
		error?: string;
	}> {
		const result = await apiPost<CreateDatasetMasterPayload>("/datasets", {
			name: request.name,
			description: request.description,
			// user_id is automatically added by the API interceptor
		});

		if (isApiSuccess(result)) {
			// Transform the response to match the expected format
			const dataset: Dataset = {
				id: result.payload.dataset_id,
				name: result.payload.name,
				description: result.payload.description,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				status: "uploading", // Use simplified status from backend
			};

			return {
				success: true,
				data: {
					datasetId: result.payload.dataset_id,
					dataset,
				},
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async uploadTransactionFile(
		request: UploadFileRequest
	): Promise<{ success: boolean; data?: any; error?: string }> {
		const formData = new FormData();
		formData.append("transactions", request.file);

		// Add user_id to FormData since the interceptor can't handle FormData properly
		const userId = localStorage.getItem("user_id");
		if (userId) {
			formData.append("user_id", userId);
		}

		const result = await apiPost<UploadFilePayload>(
			`/datasets/${request.datasetId}/transactions`,
			formData,
			{
				headers: {
					"Content-Type": undefined, // Explicitly remove Content-Type to let browser set multipart/form-data
				},
			}
		);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: {
					datasetId: request.datasetId,
					fileType: "transactions",
					status: "uploaded",
					file_upload_id: result.payload.file_upload_id,
					task_id: result.payload.task_id,
				},
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async uploadProductLookupFile(
		request: UploadFileRequest
	): Promise<{ success: boolean; data?: any; error?: string }> {
		const formData = new FormData();
		formData.append("product_lookup", request.file);

		// Add user_id to FormData since the interceptor can't handle FormData properly
		const userId = localStorage.getItem("user_id");
		if (userId) {
			formData.append("user_id", userId);
		}

		const result = await apiPost<UploadFilePayload>(
			`/datasets/${request.datasetId}/productlookups`,
			formData,
			{
				headers: {
					"Content-Type": undefined, // Explicitly remove Content-Type to let browser set multipart/form-data
				},
			}
		);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: {
					datasetId: request.datasetId,
					fileType: "product_lookup",
					status: "uploaded",
					file_upload_id: result.payload.file_upload_id,
					task_id: result.payload.task_id,
				},
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async uploadCausalLookupFile(
		request: UploadFileRequest
	): Promise<{ success: boolean; data?: any; error?: string }> {
		const formData = new FormData();
		formData.append("causal_lookup", request.file);

		// Add user_id to FormData since the interceptor can't handle FormData properly
		const userId = localStorage.getItem("user_id");
		if (userId) {
			formData.append("user_id", userId);
		}

		const result = await apiPost<UploadFilePayload>(
			`/datasets/${request.datasetId}/causallookups`,
			formData,
			{
				headers: {
					"Content-Type": undefined, // Explicitly remove Content-Type to let browser set multipart/form-data
				},
			}
		);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: {
					datasetId: request.datasetId,
					fileType: "causal_lookup",
					status: "uploaded",
					file_upload_id: result.payload.file_upload_id,
					task_id: result.payload.task_id,
				},
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async getDatasetById(
		id: number
	): Promise<{ success: boolean; data?: Dataset; error?: string }> {
		const result = await apiGet<Dataset>(`/datasets/${id}`);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: result.payload,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async deleteDataset(
		id: number
	): Promise<{ success: boolean; error?: string }> {
		const result = await apiPost<null>(`/datasets/${id}`, null, {
			method: "DELETE",
		});

		if (isApiSuccess(result)) {
			return {
				success: true,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async getVariableStatistics(
		datasetId: string,
		table: string,
		variable: string
	): Promise<{ success: boolean; data?: VariableStats; error?: string }> {
		const result = await apiGet<DatasetAnalyticsPayload>(
			`/datasets/${datasetId}/${table}/${variable}`
		);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: result.payload,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async getBivariateVisualization(
		datasetId: string,
		table1: string,
		variable1: string,
		table2: string,
		variable2: string
	): Promise<{
		success: boolean;
		data?: BivariateVisualizationPayload;
		error?: string;
	}> {
		const result = await apiGet<BivariateVisualizationPayload>(
			`/datasets/${datasetId}/visualizations/bivariate`,
			{
				params: {
					table1,
					variable1,
					table2,
					variable2,
				},
			}
		);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: result.payload,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},
};
