export interface DecompositionCategory {
	category_id: number;
	name: string;
	code_name: string;
	description: string;
	characteristics: {
		time_period: "current" | "pre" | "post";
		brand_scope: "same" | "different";
		item_scope: "same" | "different";
		store_scope: "same" | "different";
	};
}

export interface DecompositionAnalysisRequest {
	upc: string;
	store_id: number;
	category: string;
	start_time: string; // ISO datetime
	end_time: string; // ISO datetime
	campaign_id?: number;
}

export interface DecompositionResult {
	name: string;
	description: string;
	percentage_change: number;
	absolute_change: number;
	confidence_level: "low" | "medium" | "high";
	baseline_demand: number;
	campaign_demand: number;
	decomposition_demand: number;
}

export interface DecompositionAnalysisResponse {
	dataset_id: number;
	analysis_id: string;
	request_id: number;
	target_parameters: {
		upc: string;
		store_id: number;
		category: string;
		brand: string;
		time_period: {
			start_time: string;
			end_time: string;
			pre_period: [string, string];
			current_period: [string, string];
			post_period: [string, string];
		};
	};
	baseline_demand: {
		total_units: number;
		total_revenue: number;
		average_weekly_units: number;
	};
	campaign_demand: {
		total_units: number;
		total_revenue: number;
		average_weekly_units: number;
	};
	decomposition_analysis: {
		[key: string]: DecompositionResult;
	};
	summary: {
		total_change_percentage: number;
		net_incremental_units: number;
		campaign_effectiveness: "low" | "medium" | "high";
		data_coverage: {
			missing_data_percentage: number;
			imputed_values: number;
			total_categories_analyzed: number;
			categories_with_errors: number;
		};
	};
	metadata: {
		analysis_date: string;
		processing_time_ms: number;
		campaign_id?: number;
		campaign_name?: string;
		model_versions: {
			sku_choice: string;
			category_incidence: string;
			store_choice: string;
			quantity: string;
		};
	};
}

export interface DecompositionStatusResponse {
	request_id: number;
	dataset_id: number;
	status: "processing" | "completed" | "failed";
	created_at: string;
	completed_at?: string;
	processing_time_ms?: number;
	target_parameters: {
		upc: string;
		store_id: number;
		category: string;
		brand: string;
		start_time: string;
		end_time: string;
	};
	campaign_id?: number;
	campaign_name?: string;
	results?: DecompositionAnalysisResponse;
}

export interface DecompositionHistoryRequest {
	status?: "processing" | "completed" | "failed";
	limit?: number;
}

export interface DecompositionHistoryResponse {
	dataset_id: number;
	requests: Array<{
		request_id: number;
		target_parameters: {
			upc: string;
			store_id: number;
			category: string;
			brand: string;
			start_time: string;
			end_time: string;
		};
		campaign_id?: number;
		campaign_name?: string;
		status: "processing" | "completed" | "failed";
		created_at: string;
		completed_at?: string;
		processing_time_ms?: number;
		summary?: {
			total_change_percentage: number;
			net_incremental_units: number;
			campaign_effectiveness: "low" | "medium" | "high";
		};
	}>;
	total_requests: number;
	filters_applied: {
		status?: string;
		limit: number;
	};
}

export interface CampaignImpactTarget {
	upc: string;
	store_id: number;
	category: string;
	brand: string;
}

export interface CampaignImpactAnalysisRequest {
	targets: CampaignImpactTarget[];
	start_time: string;
	end_time: string;
}

export interface CampaignImpactAnalysisResponse {
	campaign_id: number;
	campaign_name: string;
	analysis_period: {
		start_time: string;
		end_time: string;
	};
	aggregate_metrics: {
		total_targets_analyzed: number;
		successful_analyses: number;
		failed_analyses: number;
		aggregate_baseline_units: number;
		aggregate_campaign_units: number;
		aggregate_lift_percentage: number;
		aggregate_incremental_units: number;
	};
	target_analyses: Array<{
		target_index: number;
		target: CampaignImpactTarget;
		analysis: DecompositionAnalysisResponse;
	}>;
	metadata: {
		analysis_date: string;
		dataset_id: number;
	};
}

export interface DecompositionCategoriesResponse {
	categories: DecompositionCategory[];
	total_categories: number;
	description: string;
}

// Export data format for CSV/Excel
export interface DecompositionExportData {
	analysis_id: string;
	target_upc: string;
	target_store_id: number;
	target_category: string;
	target_brand: string;
	campaign_period: string;
	category_name: string;
	category_description: string;
	percentage_change: number;
	absolute_change: number;
	confidence_level: string;
	baseline_demand: number;
	campaign_demand: number;
	decomposition_demand: number;
	analysis_date: string;
	campaign_name?: string;
}

// Comparison analysis types
export interface ComparisonScenario {
	id: string;
	name: string;
	request: DecompositionAnalysisRequest;
	response?: DecompositionAnalysisResponse;
	status: "pending" | "loading" | "completed" | "error";
	error?: string;
}

export interface ComparisonAnalysis {
	scenarios: ComparisonScenario[];
	selectedCategories: string[];
	comparisonMode: "percentage" | "absolute" | "both";
}

// Cache types
export interface DecompositionCacheEntry {
	key: string;
	data: DecompositionAnalysisResponse;
	timestamp: number;
	expiresAt: number;
}

// Filter and sorting types
export interface DecompositionFilters {
	confidenceLevel?: "low" | "medium" | "high";
	changeType?: "positive" | "negative" | "all";
	minimumChange?: number;
	timePeriod?: "current" | "pre" | "post" | "all";
	brandScope?: "same" | "different" | "all";
	storeScope?: "same" | "different" | "all";
}

export interface DecompositionSortOptions {
	field: "name" | "percentage_change" | "absolute_change" | "confidence_level";
	direction: "asc" | "desc";
}
