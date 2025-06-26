import { api } from "@/utils/api";
import { auth } from "@/utils/firebase";
import {
	Campaign,
	PromotionRule,
	CampaignResponse,
	CreateCampaignRequest,
	CreatePromotionRuleRequest,
} from "@/utils/types/campaign";

export const campaignService = {
	async getCampaignsByDataset(datasetId: number): Promise<CampaignResponse> {
		const response = await api.get(`/datasets/${datasetId}/campaigns`);
		return {
			success: true,
			data: response.data.campaigns || [],
		};
	},

	async getAllCampaigns(): Promise<CampaignResponse> {
		const user = auth.currentUser;
		if (!user) {
			return {
				success: false,
				error: "User not authenticated",
			};
		}

		const response = await api.get(`/users/${user.uid}/campaigns`);
		return {
			success: true,
			data: response.data.campaigns || [],
		};
	},

	async createCampaign(
		request: CreateCampaignRequest
	): Promise<{ success: boolean; data?: Campaign; error?: string }> {
		const response = await api.post(
			`/datasets/${request.dataset_id}/campaigns`,
			{ name: request.name }
		);

		// Transform response to match Campaign interface
		const campaign: Campaign = {
			campaign_id: response.data.campaign_id,
			name: response.data.name,
			description: response.data.description,
			dataset_id: response.data.dataset_id,
			created_at: response.data.created_at,
			updated_at: response.data.created_at,
			is_active: true,
			promotion_rules_count: 0,
		};

		return {
			success: true,
			data: campaign,
		};
	},

	async getPromotionRules(
		campaignId: number
	): Promise<{ success: boolean; data?: PromotionRule[]; error?: string }> {
		const response = await api.get(`/campaigns/${campaignId}/promotionrules`);
		return {
			success: true,
			data: response.data.promotion_rules || [],
		};
	},

	async createPromotionRule(
		campaignId: number,
		request: CreatePromotionRuleRequest
	): Promise<{ success: boolean; data?: PromotionRule; error?: string }> {
		const response = await api.post(
			`/campaigns/${campaignId}/promotionrules`,
			request
		);
		return {
			success: true,
			data: response.data,
		};
	},
};
