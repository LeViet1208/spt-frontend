import { api } from "@/utils/api";
import { auth } from "@/utils/firebase";
import {
	Dataset,
	CreateDatasetMasterRequest,
	CreateDatasetMasterResponse,
	UploadFileRequest,
	UploadFileResponse,
	DatasetResponse,
	VariableStats,
	DatasetAnalyticsResponse,
} from "@/utils/types/dataset";

export const datasetService = {
	async getDatasets(): Promise<DatasetResponse> {
		const user = auth.currentUser;
		if (!user) {
			return {
				success: false,
				error: "User not authenticated",
			};
		}

		const response = await api.get(`/users/${user.uid}/datasets`);

		// Transform backend response to match our Dataset interface
		const transformedDatasets: Dataset[] =
			response.data.datasets?.map((dataset: any) => ({
				id: dataset.dataset_id,
				name: dataset.name || `Dataset ${dataset.dataset_id}`,
				description: dataset.description,
				createdAt: new Date(dataset.created_at * 1000).toISOString(),
				updatedAt: new Date(dataset.created_at * 1000).toISOString(),
				importStatus: this.mapFileUploadsToImportStatus(dataset.file_uploads),
				analysisStatus: this.mapTrainingToAnalysisStatus(
					dataset.latest_training
				),
			})) || [];

		return {
			success: true,
			data: transformedDatasets,
		};
	},

	// Helper function to map file uploads to import status
	mapFileUploadsToImportStatus(fileUploads: any): Dataset["importStatus"] {
		if (!fileUploads) return "importing_transaction";

		const { transactions, product_lookup, causal_lookup } = fileUploads;

		if (!transactions || transactions.status !== "completed") {
			return "importing_transaction";
		}
		if (!product_lookup || product_lookup.status !== "completed") {
			return "importing_product_lookup";
		}
		if (!causal_lookup || causal_lookup.status !== "completed") {
			return "importing_causal_lookup";
		}

		return "import_completed";
	},

	// Helper function to map training status to analysis status
	mapTrainingToAnalysisStatus(latestTraining: any): Dataset["analysisStatus"] {
		if (!latestTraining) return "not_started";

		if (latestTraining.status === "completed") {
			return "analyzed";
		} else if (
			latestTraining.status === "running" ||
			latestTraining.status === "pending"
		) {
			return "analyzing";
		}

		return "not_started";
	},

	async createDatasetMaster(
		request: CreateDatasetMasterRequest
	): Promise<CreateDatasetMasterResponse> {
		const response = await api.post("/datasets/master", request);
		return response.data;
	},

	async uploadTransactionFile(
		request: UploadFileRequest
	): Promise<UploadFileResponse> {
		const formData = new FormData();
		formData.append("file", request.file);
		formData.append("datasetId", request.datasetId.toString());

		const response = await api.post("/datasets/upload/transaction", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	},

	async uploadProductLookupFile(
		request: UploadFileRequest
	): Promise<UploadFileResponse> {
		const formData = new FormData();
		formData.append("file", request.file);
		formData.append("datasetId", request.datasetId.toString());

		const response = await api.post(
			"/datasets/upload/product-lookup",
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return response.data;
	},

	async uploadCausalLookupFile(
		request: UploadFileRequest
	): Promise<UploadFileResponse> {
		const formData = new FormData();
		formData.append("file", request.file);
		formData.append("datasetId", request.datasetId.toString());

		const response = await api.post(
			"/datasets/upload/causal-lookup",
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);
		return response.data;
	},

	async getDatasetById(
		id: number
	): Promise<{ success: boolean; data?: Dataset; error?: string }> {
		const response = await api.get(`/datasets/${id}`);
		return response.data;
	},

	async deleteDataset(
		id: number
	): Promise<{ success: boolean; error?: string }> {
		const response = await api.delete(`/datasets/${id}`);
		return response.data;
	},

	async getVariableStatistics(
		datasetId: string,
		table: string,
		variable: string
	): Promise<DatasetAnalyticsResponse> {
		try {
			const response = await api.get(
				`/datasets/${datasetId}/${table}/${variable}`
			);
			return {
				success: true,
				data: response.data,
			};
		} catch (error: any) {
			return {
				success: false,
				error:
					error.response?.data?.message ||
					"Failed to fetch variable statistics",
			};
		}
	},
};
