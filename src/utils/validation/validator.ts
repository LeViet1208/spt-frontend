import { isValid, parseISO, format } from "date-fns";
import {
	ValidationSchema,
	ValidationResult,
	ValidationError,
	ValidationWarning,
	ValidationSummary,
	ParsedFile,
	ColumnSchema,
	ValidationRule,
} from "./types";

export class DataValidator {
	private schema: ValidationSchema;
	private parsedFile: ParsedFile;

	constructor(schema: ValidationSchema, parsedFile: ParsedFile) {
		this.schema = schema;
		this.parsedFile = parsedFile;
	}

	validate(): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Check for missing required columns
		const missingColumns = this.checkMissingColumns();
		errors.push(...missingColumns);

		// Check for extra columns (not errors, but warnings)
		const extraColumns = this.checkExtraColumns();
		warnings.push(...extraColumns);

		// Validate data types and rules for each row
		const dataValidationResults = this.validateDataRows();
		errors.push(...dataValidationResults.errors);
		warnings.push(...dataValidationResults.warnings);

		// Generate summary
		const summary = this.generateSummary(errors, warnings);

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			parsedData: this.parsedFile,
			summary,
		};
	}

	private checkMissingColumns(): ValidationError[] {
		const errors: ValidationError[] = [];
		const requiredColumns = this.schema.requiredColumns.map((col) => col.name);
		const fileHeaders = this.parsedFile.headers.map((h) => h.toLowerCase());

		for (const requiredColumn of requiredColumns) {
			const found = fileHeaders.includes(requiredColumn.toLowerCase());
			if (!found) {
				errors.push({
					type: "missing_column",
					column: requiredColumn,
					message: `Required column '${requiredColumn}' is missing from the file`,
					severity: "error",
				});
			}
		}

		return errors;
	}

	private checkExtraColumns(): ValidationWarning[] {
		const warnings: ValidationWarning[] = [];
		const schemaColumns = this.schema.requiredColumns.map((col) =>
			col.name.toLowerCase()
		);
		const optionalColumns =
			this.schema.optionalColumns?.map((col) => col.name.toLowerCase()) || [];
		const allExpectedColumns = [...schemaColumns, ...optionalColumns];

		for (const header of this.parsedFile.headers) {
			if (!allExpectedColumns.includes(header.toLowerCase())) {
				warnings.push({
					type: "data_quality",
					column: header,
					message: `Column '${header}' is not expected in this file type`,
				});
			}
		}

		return warnings;
	}

	private validateDataRows(): {
		errors: ValidationError[];
		warnings: ValidationWarning[];
	} {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Create a map of column schemas for quick lookup
		const columnSchemaMap = new Map<string, ColumnSchema>();
		this.schema.requiredColumns.forEach((col) => {
			columnSchemaMap.set(col.name.toLowerCase(), col);
		});

		// Validate each row
		this.parsedFile.data.forEach((row, rowIndex) => {
			const actualRowNumber = rowIndex + 2; // +2 because arrays are 0-indexed and we skip header row

			// Check each column in the schema
			for (const [columnName, columnSchema] of columnSchemaMap.entries()) {
				const actualColumnName = this.findActualColumnName(columnName);
				if (!actualColumnName) continue; // Column missing, already reported

				const value = row[actualColumnName];

				// Check if required field is empty
				if (columnSchema.required && this.isEmpty(value)) {
					errors.push({
						type: "empty_required_field",
						column: columnSchema.name,
						row: actualRowNumber,
						value,
						message: `Required field '${columnSchema.name}' is empty in row ${actualRowNumber}`,
						severity: "error",
					});
					continue;
				}

				// Skip validation for empty optional fields
				if (!columnSchema.required && this.isEmpty(value)) {
					continue;
				}

				// Validate data type
				const dataTypeError = this.validateDataType(
					columnSchema,
					value,
					actualRowNumber
				);
				if (dataTypeError) {
					errors.push(dataTypeError);
					continue; // Skip further validation if data type is wrong
				}

				// Validate rules
				const ruleErrors = this.validateRules(
					columnSchema,
					value,
					actualRowNumber
				);
				errors.push(...ruleErrors);
			}
		});

		return { errors, warnings };
	}

	private findActualColumnName(schemaColumnName: string): string | null {
		const found = this.parsedFile.headers.find(
			(h) => h.toLowerCase() === schemaColumnName.toLowerCase()
		);
		return found || null;
	}

	private isEmpty(value: any): boolean {
		return (
			value === null ||
			value === undefined ||
			value === "" ||
			(typeof value === "string" && value.trim() === "")
		);
	}

	private validateDataType(
		columnSchema: ColumnSchema,
		value: any,
		rowNumber: number
	): ValidationError | null {
		if (this.isEmpty(value)) return null;

		const stringValue = String(value).trim();

		switch (columnSchema.type) {
			case "number":
				if (isNaN(Number(stringValue)) || stringValue === "") {
					return {
						type: "invalid_data_type",
						column: columnSchema.name,
						row: rowNumber,
						value,
						message: `Value '${value}' in column '${columnSchema.name}' (row ${rowNumber}) is not a valid number`,
						severity: "error",
					};
				}
				break;

			case "integer":
				const num = Number(stringValue);
				if (isNaN(num) || !Number.isInteger(num)) {
					return {
						type: "invalid_data_type",
						column: columnSchema.name,
						row: rowNumber,
						value,
						message: `Value '${value}' in column '${columnSchema.name}' (row ${rowNumber}) is not a valid integer`,
						severity: "error",
					};
				}
				break;

			case "datetime":
				// Try to parse as date
				const date = new Date(stringValue);
				if (isNaN(date.getTime())) {
					return {
						type: "invalid_data_type",
						column: columnSchema.name,
						row: rowNumber,
						value,
						message: `Value '${value}' in column '${columnSchema.name}' (row ${rowNumber}) is not a valid datetime`,
						severity: "error",
					};
				}
				break;

			case "alphanumeric":
				if (!/^[a-zA-Z0-9]+$/.test(stringValue)) {
					return {
						type: "invalid_data_type",
						column: columnSchema.name,
						row: rowNumber,
						value,
						message: `Value '${value}' in column '${columnSchema.name}' (row ${rowNumber}) must contain only letters and numbers`,
						severity: "error",
					};
				}
				break;

			case "text":
				// Text validation - just check it's not empty if required
				if (typeof value !== "string" && typeof value !== "number") {
					return {
						type: "invalid_data_type",
						column: columnSchema.name,
						row: rowNumber,
						value,
						message: `Value '${value}' in column '${columnSchema.name}' (row ${rowNumber}) is not valid text`,
						severity: "error",
					};
				}
				break;
		}

		return null;
	}

	private validateRules(
		columnSchema: ColumnSchema,
		value: any,
		rowNumber: number
	): ValidationError[] {
		const errors: ValidationError[] = [];

		if (!columnSchema.validation) return errors;

		const stringValue = String(value).trim();
		const numericValue = Number(stringValue);

		for (const rule of columnSchema.validation) {
			let isValid = true;
			const errorMessage = rule.message;

			switch (rule.type) {
				case "min":
					if (columnSchema.type === "text") {
						isValid = stringValue.length >= rule.value;
					} else if (
						columnSchema.type === "number" ||
						columnSchema.type === "integer"
					) {
						isValid = numericValue >= rule.value;
					}
					break;

				case "max":
					if (columnSchema.type === "text") {
						isValid = stringValue.length <= rule.value;
					} else if (
						columnSchema.type === "number" ||
						columnSchema.type === "integer"
					) {
						isValid = numericValue <= rule.value;
					}
					break;

				case "pattern":
					if (rule.value instanceof RegExp) {
						isValid = rule.value.test(stringValue);
					}
					break;

				case "enum":
					if (Array.isArray(rule.value)) {
						isValid =
							rule.value.includes(value) || rule.value.includes(stringValue);
					}
					break;

				case "positive":
					isValid = numericValue > 0;
					break;

				case "custom":
					if (rule.validator) {
						isValid = rule.validator(value);
					}
					break;
			}

			if (!isValid) {
				errors.push({
					type: "invalid_format",
					column: columnSchema.name,
					row: rowNumber,
					value,
					message: `${errorMessage} (row ${rowNumber})`,
					severity: "error",
				});
			}
		}

		return errors;
	}

	private generateSummary(
		errors: ValidationError[],
		warnings: ValidationWarning[]
	): ValidationSummary {
		const requiredColumnNames = this.schema.requiredColumns.map(
			(col) => col.name
		);
		const presentColumns = this.parsedFile.headers.filter((header) =>
			requiredColumnNames.some(
				(req) => req.toLowerCase() === header.toLowerCase()
			)
		);

		const missingColumns = errors
			.filter((error) => error.type === "missing_column")
			.map((error) => error.column);

		const extraColumns = warnings
			.filter((warning) => warning.type === "data_quality")
			.map((warning) => warning.column);

		const errorRows = new Set(errors.filter((e) => e.row).map((e) => e.row));
		const validRows = this.parsedFile.rowCount - errorRows.size;

		return {
			totalRows: this.parsedFile.rowCount,
			validRows,
			errorCount: errors.length,
			warningCount: warnings.length,
			missingColumns,
			extraColumns,
			columnCoverage:
				(presentColumns.length / requiredColumnNames.length) * 100,
		};
	}
}

export const validateFile = (
	schema: ValidationSchema,
	parsedFile: ParsedFile
): ValidationResult => {
	const validator = new DataValidator(schema, parsedFile);
	return validator.validate();
};
