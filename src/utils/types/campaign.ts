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

export type RuleType =
	| "price_reduction"
	| "product_size_increase"
	| "feature_yes_no"
	| "display_yes_no";

export type TargetType = "category" | "brand" | "upc";

export interface PromotionRule {
	promotion_rule_id: number;
	name: string;
	rule_type: RuleType;
	target_type: TargetType;
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

// Removed CampaignResponse - using standardized API response format instead

export interface CreateCampaignRequest {
	name: string;
	dataset_id: number;
}

export interface CreatePromotionRuleRequest {
	name: string;
	rule_type: RuleType;
	target_type: TargetType;
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

// Form data types for better UX (using Date objects)
export interface PromotionRuleFormData {
	name: string;
	rule_type: RuleType;
	target_type: TargetType;
	start_date: Date;
	end_date: Date;
	target_categories?: string[];
	target_brands?: string[];
	target_upcs?: string[];
	price_reduction_percentage?: number;
	price_reduction_amount?: number;
	size_increase_percentage?: number;
	feature_enabled?: boolean;
	display_enabled?: boolean;
}

// Validation result interface
export interface PromotionRuleValidationResult {
	valid: boolean;
	message: string;
	details?: {
		valid_upcs?: string[];
		valid_brands?: string[];
		valid_categories?: string[];
		total_upcs_checked?: number;
		total_brands_checked?: number;
		total_categories_checked?: number;
		warning?: string;
	};
	error?: string;
}
