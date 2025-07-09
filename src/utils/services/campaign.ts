import { apiGet, apiPost, apiPut } from "@/utils/api";
import { auth } from "@/utils/firebase";
import { ApiResult, isApiSuccess } from "@/utils/types/api";
import { handleApiError } from "@/utils/errorHandler";
import {
	Campaign,
	PromotionRule,
	CreateCampaignRequest,
	CreatePromotionRuleRequest,
	PromotionRuleValidationResult,
	RuleType,
	TargetType,
} from "@/utils/types/campaign";

// Updated payload types for standardized API responses
interface CampaignsByDatasetPayload {
	campaign_id: number;
	campaign_name: string;
	promotion_rules: PromotionRule[];
	total_rules: number;
}

interface UserCampaignsPayload {
	user_id: string;
	campaigns: Campaign[];
	total_campaigns: number;
}

interface CreateCampaignPayload {
	message: string;
	campaign_id: number;
	name: string;
	description: string;
	dataset_id: number;
	created_at: string;
}

interface UpdateCampaignRequest {
	name: string;
	description?: string;
}

interface PromotionRulesPayload {
	campaign_id: number;
	campaign_name: string;
	promotion_rules: PromotionRule[];
	total_rules: number;
}

interface CreatePromotionRulePayload {
	message: string;
	promotion_rule_id: number;
	name: string;
	rule_type: string;
	target_type: string;
	campaign_id: number;
	created_at: string;
}

export const campaignService = {
	async getCampaignsByDataset(
		datasetId: number
	): Promise<{ success: boolean; data?: Campaign[]; error?: string }> {
		const result = await apiGet<{
			dataset_id: number;
			campaigns: Campaign[];
			total_campaigns: number;
		}>(`/datasets/${datasetId}/campaigns`);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: result.payload.campaigns,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async getAllCampaigns(): Promise<{
		success: boolean;
		data?: Campaign[];
		error?: string;
	}> {
		await auth.authStateReady();
		const user = auth.currentUser;
		if (!user) {
			return {
				success: false,
				error: "User not authenticated",
			};
		}

		const result = await apiGet<UserCampaignsPayload>(
			`/users/${user.uid}/campaigns`
		);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: result.payload.campaigns,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async createCampaign(
		request: CreateCampaignRequest
	): Promise<{ success: boolean; data?: Campaign; error?: string }> {
		const result = await apiPost<CreateCampaignPayload>(
			`/datasets/${request.dataset_id}/campaigns`,
			{ name: request.name }
		);

		if (isApiSuccess(result)) {
			// Transform response to match Campaign interface
			const campaign: Campaign = {
				campaign_id: result.payload.campaign_id,
				name: result.payload.name,
				description: result.payload.description,
				dataset_id: result.payload.dataset_id,
				created_at: result.payload.created_at,
				updated_at: result.payload.created_at,
				is_active: true,
				promotion_rules_count: 0,
			};

			return {
				success: true,
				data: campaign,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async updateCampaign(
		campaignId: number,
		request: UpdateCampaignRequest
	): Promise<{ success: boolean; data?: Campaign; error?: string }> {
		const result = await apiPut<{
			campaign_id: number;
			name: string;
			description: string;
			dataset_id: number;
			created_at: string;
			updated_at: string;
		}>(`/campaigns/${campaignId}`, request);

		if (isApiSuccess(result)) {
			// Transform response to match Campaign interface
			const campaign: Campaign = {
				campaign_id: result.payload.campaign_id,
				name: result.payload.name,
				description: result.payload.description,
				dataset_id: result.payload.dataset_id,
				created_at: result.payload.created_at,
				updated_at: result.payload.updated_at,
				is_active: true,
				promotion_rules_count: 0,
			};

			return {
				success: true,
				data: campaign,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async getPromotionRules(
		campaignId: number
	): Promise<{ success: boolean; data?: PromotionRule[]; error?: string }> {
		const result = await apiGet<PromotionRulesPayload>(
			`/campaigns/${campaignId}/promotionrules`
		);

		if (isApiSuccess(result)) {
			return {
				success: true,
				data: result.payload.promotion_rules,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async createPromotionRule(
		campaignId: number,
		request: CreatePromotionRuleRequest
	): Promise<{ success: boolean; data?: PromotionRule; error?: string }> {
		const result = await apiPost<CreatePromotionRulePayload>(
			`/campaigns/${campaignId}/promotionrules`,
			request
		);

		if (isApiSuccess(result)) {
			// Transform response to match PromotionRule interface
			const promotionRule: PromotionRule = {
				promotion_rule_id: result.payload.promotion_rule_id,
				name: result.payload.name,
				rule_type: result.payload.rule_type as RuleType,
				target_type: result.payload.target_type as TargetType,
				start_date: request.start_date,
				end_date: request.end_date,
				created_at: result.payload.created_at,
				updated_at: result.payload.created_at,
				is_active: true,
				// Add optional fields from request
				target_categories: request.target_categories,
				target_brands: request.target_brands,
				target_upcs: request.target_upcs,
				price_reduction_percentage: request.price_reduction_percentage,
				price_reduction_amount: request.price_reduction_amount,
				size_increase_percentage: request.size_increase_percentage,
				feature_enabled: request.feature_enabled,
				display_enabled: request.display_enabled,
			};

			return {
				success: true,
				data: promotionRule,
			};
		} else {
			return {
				success: false,
				error: result.message,
			};
		}
	},

	async validatePromotionRule(
		campaignId: number,
		request: Omit<CreatePromotionRuleRequest, "name">
	): Promise<{
		success: boolean;
		data?: PromotionRuleValidationResult;
		error?: string;
	}> {
		const result = await apiPost<PromotionRuleValidationResult>(
			`/campaigns/${campaignId}/promotionrules/validate`,
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
};
