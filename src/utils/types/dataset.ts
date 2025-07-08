export interface Dataset {
	id: number;
	name: string;
	status: "uploading" | "analyzing" | "completed" | "failed";
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface CreateDatasetRequest {
	name: string;
	description?: string;
	files: {
		transaction: File;
		product_lookup: File;
		causal_lookup: File;
	};
}

export interface CreateDatasetMasterRequest {
	name: string;
	description?: string;
}

// Updated payload types for standardized API responses
export interface CreateDatasetMasterPayload {
	dataset_id: number;
	name: string;
	description: string;
}

export interface UploadFileRequest {
	datasetId: number;
	file: File;
	fileType: "transaction" | "product_lookup" | "causal_lookup";
}

export interface UploadFilePayload {
	file_upload_id: number;
	task_id: string;
}

export interface DatasetsListPayload {
	user_id: string;
	datasets: DatasetBackendResponse[];
	total_datasets: number;
}

// Backend dataset response format
export interface DatasetBackendResponse {
	dataset_id: number;
	name: string;
	description?: string;
	created_at: number;
	status: "uploading" | "analyzing" | "completed" | "failed"; // Simplified status
	campaigns_count: number;
	metrics?: {
		total_transactions: number;
		unique_upcs: number;
		unique_stores: number;
		is_ready_for_training: boolean;
	};
}

// Analytics types
export interface NumericalStats {
	min: number;
	q1: number;
	median: number;
	q3: number;
	max: number;
	mean: number;
	std: number;
	mode: number[];
	count: number;
	unique: number;
	bins: { [key: string]: number };
}

export interface CategoricalStats {
	count: number;
	unique: number;
	bins: { [key: string]: number };
}

export type VariableStats = NumericalStats | CategoricalStats;

export interface ChildTable {
	key: string;
	label: string;
}

export interface Variable {
	key: string;
	label: string;
	type: "numerical" | "categorical";
}

export interface ProcessedNumericalStats {
	type: "numerical";
	mean: number;
	median: number;
	mode: number | string;
	min: number;
	max: number;
	q1: number;
	q3: number;
	std: number;
	count: number;
	unique: number;
	bins: { [key: string]: number };
}

export interface ProcessedCategoricalStats {
	type: "categorical";
	mode: string;
	frequency: { [key: string]: number };
	count: number;
	unique: number;
	pieData: { name: string; value: number }[];
}

export type ProcessedStats =
	| ProcessedNumericalStats
	| ProcessedCategoricalStats;

export interface HistogramDataPoint {
	value?: number;
	category?: string;
	count: number;
}

// Updated analytics payload types
export type DatasetAnalyticsPayload = VariableStats;

// Bivariate visualization types
export interface BivariateVisualizationRequest {
	table1: string;
	variable1: string;
	table2: string;
	variable2: string;
}

export interface BivariateDataPoint {
	x: number | string;
	y: number | string;
	count?: number;
}

export interface BivariateVisualizationPayload {
	dataset_id: number;
	analysis: {
		variable1: {
			name: string;
			dataset: string;
			type: "numerical" | "categorical";
			description: string;
			stats: any;
		};
		variable2: {
			name: string;
			dataset: string;
			type: "numerical" | "categorical";
			description: string;
			stats: any;
		};
		relationship: {
			data_points: number;
			missing_data_pct: number;
			correlation?: number;
			correlation_p_value?: number;
			correlation_strength?: string;
		};
	};
	visualization: {
		recommended_chart: string;
		selected_chart: string;
		alternatives: string[];
		description: string;
		plotly_config: any;
	};
	filters_applied: any;
}

export interface ColumnRequirement {
	name: string;
	description: string;
	example: string;
}

export interface FileRequirement {
	id: string;
	name: string;
	description: string;
	requiredColumns: ColumnRequirement[];
	acceptedFormats: string[];
}
