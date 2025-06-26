export interface Campaign {
	campaign_id: number;
	name: string;
	description?: string;
	dataset_id?: number;
	created_at: string;
	updated_at: string;
	is_active: boolean;
	promotion_rules_count: number;
	dataset?: {
		dataset_id: number;
		name?: string;
		description?: string;
	};
}

export interface PromotionRule {
	promotion_rule_id: number;
	name: string;
	rule_type: "price_reduction";
	target_type: "category" | "brand" | "upc";
	target_upcs?: string[];
	target_brands?: string[];
	target_categories?: string[];
	price_reduction_percentage?: number;
	price_reduction_amount?: number;
	size_increase_percentage?: number;
	feature_enabled?: boolean;
	display_enabled?: boolean;
	start_date: number;
	end_date: number;
	created_at: string;
	updated_at: string;
	is_active: boolean;
}

export interface CampaignResponse {
	success: boolean;
	data?: Campaign[];
	error?: string;
}

export interface CreateCampaignRequest {
	name: string;
	dataset_id: number;
}

export interface CreatePromotionRuleRequest {
	name: string;
	rule_type: "price_reduction";
	target_type: "category" | "brand" | "upc";
	start_date: number;
	end_date: number;
	target_categories?: string[];
	target_brands?: string[];
	target_upcs?: string[];
	price_reduction_percentage?: number;
	price_reduction_amount?: number;
	size_increase_percentage?: number;
	feature_enabled?: boolean;
	display_enabled?: boolean;
}
