export interface ValidationSchema {
	fileType: "transaction" | "product_lookup" | "causal_lookup";
	requiredColumns: ColumnSchema[];
	optionalColumns?: ColumnSchema[];
}

export interface ColumnSchema {
	name: string;
	type: "text" | "number" | "datetime" | "boolean" | "alphanumeric" | "integer";
	required: boolean;
	validation?: ValidationRule[];
}

export interface ValidationRule {
	type: "min" | "max" | "pattern" | "enum" | "custom" | "positive";
	value?: any;
	message: string;
	validator?: (value: any) => boolean;
}

export interface ParsedFile {
	headers: string[];
	data: Record<string, any>[];
	rowCount: number;
	preview: Record<string, any>[];
	fileName: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	parsedData: ParsedFile;
	summary: ValidationSummary;
}

export interface ValidationError {
	type:
		| "missing_column"
		| "invalid_data_type"
		| "empty_required_field"
		| "invalid_format"
		| "out_of_range";
	column: string;
	row?: number;
	value?: any;
	message: string;
	severity: "error" | "warning";
}

export interface ValidationWarning {
	type: "data_quality" | "formatting" | "recommendation";
	column: string;
	row?: number;
	message: string;
}

export interface ValidationSummary {
	totalRows: number;
	validRows: number;
	errorCount: number;
	warningCount: number;
	missingColumns: string[];
	extraColumns: string[];
	columnCoverage: number; // percentage of required columns present
}

export interface FileParserOptions {
	maxPreviewRows: number;
	encoding: string;
	delimiter?: string;
}
