export interface Dataset {
	id: number;
	name: string;
	importStatus:
		| "importing_transaction"
		| "importing_product_lookup"
		| "importing_causal_lookup"
		| "import_completed"
		| "import_failed";
	analysisStatus: "not_started" | "analyzing" | "analyzed" | "analysis_failed";
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

export interface CreateDatasetMasterRequest {
	name: string;
	description?: string;
}

export interface CreateDatasetMasterResponse {
	success: boolean;
	data?: {
		datasetId: number;
		dataset: Dataset;
	};
	error?: string;
}

export interface UploadFileRequest {
	datasetId: number;
	file: File;
	fileType: "transaction" | "product_lookup" | "causal_lookup";
}

export interface UploadFileResponse {
	success: boolean;
	data?: {
		datasetId: number;
		fileType: string;
		status: string;
	};
	error?: string;
}

export interface DatasetResponse {
	success: boolean;
	data?: Dataset[];
	error?: string;
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

export interface DatasetAnalyticsResponse {
	success: boolean;
	data?: VariableStats;
	error?: string;
}
