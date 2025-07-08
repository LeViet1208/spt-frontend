import { apiGet, apiPost } from "@/utils/api";
import { ApiResult, isApiSuccess } from "@/utils/types/api";
import { handleApiError } from "@/utils/errorHandler";
import {
	DecompositionAnalysisRequest,
	DecompositionAnalysisResponse,
	DecompositionStatusResponse,
	DecompositionHistoryRequest,
	DecompositionHistoryResponse,
	CampaignImpactAnalysisRequest,
	CampaignImpactAnalysisResponse,
	DecompositionCategoriesResponse,
} from "@/utils/types/decomposition";

export const decompositionService = {
	// Analyze demand decomposition
	async analyzeDecomposition(
		datasetId: string,
		request: DecompositionAnalysisRequest
	): Promise<{
		success: boolean;
		data?: DecompositionAnalysisResponse;
		error?: string;
	}> {
		const result = await apiPost<DecompositionAnalysisResponse>(
			`/datasets/${datasetId}/demand-decomposition`,
			request
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

	// Check decomposition analysis status
	async getDecompositionStatus(requestId: number): Promise<{
		success: boolean;
		data?: DecompositionStatusResponse;
		error?: string;
	}> {
		const result = await apiGet<DecompositionStatusResponse>(
			`/demand-decomposition/${requestId}/status`
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

	// Get decomposition analysis history
	async getDecompositionHistory(
		datasetId: string,
		filters?: DecompositionHistoryRequest
	): Promise<{
		success: boolean;
		data?: DecompositionHistoryResponse;
		error?: string;
	}> {
		const params = new URLSearchParams();
		if (filters?.status) params.append("status", filters.status);
		if (filters?.limit) params.append("limit", filters.limit.toString());

		const url = `/datasets/${datasetId}/demand-decomposition/history${
			params.toString() ? `?${params.toString()}` : ""
		}`;
		const result = await apiGet<DecompositionHistoryResponse>(url);

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

	// Analyze campaign impact across multiple targets
	async analyzeCampaignImpact(
		campaignId: number,
		request: CampaignImpactAnalysisRequest
	): Promise<{
		success: boolean;
		data?: CampaignImpactAnalysisResponse;
		error?: string;
	}> {
		const result = await apiPost<CampaignImpactAnalysisResponse>(
			`/campaigns/${campaignId}/impact-analysis`,
			request
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

	// Get decomposition categories
	async getDecompositionCategories(): Promise<{
		success: boolean;
		data?: DecompositionCategoriesResponse;
		error?: string;
	}> {
		const result = await apiGet<DecompositionCategoriesResponse>(
			"/decomposition-categories"
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

	// Initialize decomposition categories (if needed)
	async initializeDecompositionCategories(): Promise<{
		success: boolean;
		data?: { message: string; total_categories: number };
		error?: string;
	}> {
		const result = await apiPost<{ message: string; total_categories: number }>(
			"/decomposition-categories"
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

	// Helper function to generate cache key
	generateCacheKey(request: DecompositionAnalysisRequest): string {
		const {
			upc,
			store_id,
			category,
			brand,
			start_time,
			end_time,
			campaign_id,
		} = request;
		return `decomp_${upc}_${store_id}_${category}_${brand}_${start_time}_${end_time}_${
			campaign_id || "no_campaign"
		}`;
	},

	// Helper function to format datetime for API
	formatDateTime(date: Date): string {
		return date.toISOString();
	},

	// Helper function to parse datetime from API
	parseDateTime(dateString: string): Date {
		return new Date(dateString);
	},

	// Helper function to validate request parameters
	validateRequest(request: DecompositionAnalysisRequest): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!request.upc?.trim()) {
			errors.push("UPC is required");
		}

		if (!request.store_id || request.store_id <= 0) {
			errors.push("Valid store ID is required");
		}

		if (!request.category?.trim()) {
			errors.push("Category is required");
		}

		if (!request.brand?.trim()) {
			errors.push("Brand is required");
		}

		if (!request.start_time) {
			errors.push("Start time is required");
		}

		if (!request.end_time) {
			errors.push("End time is required");
		}

		if (request.start_time && request.end_time) {
			const start = new Date(request.start_time);
			const end = new Date(request.end_time);

			if (start >= end) {
				errors.push("End time must be after start time");
			}

			if (isNaN(start.getTime())) {
				errors.push("Invalid start time format");
			}

			if (isNaN(end.getTime())) {
				errors.push("Invalid end time format");
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	},
};
