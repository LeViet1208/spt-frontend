"use client";

import { useState, useCallback } from "react";
import { parseFile } from "@/utils/fileParser";
import { validateFile } from "@/utils/validation/validator";
import { getSchemaByFileType } from "@/utils/validation/schemas";
import {
	ValidationResult,
	ParsedFile,
	FileParserOptions,
} from "@/utils/validation/types";

interface UseFileValidationState {
	isValidating: boolean;
	validationResult: ValidationResult | null;
	error: string | null;
}

export const useFileValidation = () => {
	const [state, setState] = useState<UseFileValidationState>({
		isValidating: false,
		validationResult: null,
		error: null,
	});

	const validateFileData = useCallback(
		async (
			file: File,
			fileType: "transaction" | "product_lookup" | "causal_lookup",
			options?: FileParserOptions
		): Promise<ValidationResult | null> => {
			setState((prev) => ({
				...prev,
				isValidating: true,
				error: null,
				validationResult: null,
			}));

			try {
				// Get validation schema for file type
				const schema = getSchemaByFileType(fileType);
				if (!schema) {
					throw new Error(
						`No validation schema found for file type: ${fileType}`
					);
				}

				// Parse the file
				const parsedFile = await parseFile(file, options);

				// Validate the parsed data
				const validationResult = validateFile(schema, parsedFile);

				setState((prev) => ({
					...prev,
					isValidating: false,
					validationResult,
					error: null,
				}));

				return validationResult;
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Unknown validation error occurred";

				setState((prev) => ({
					...prev,
					isValidating: false,
					error: errorMessage,
				}));

				return null;
			}
		},
		[]
	);

	const clearValidation = useCallback(() => {
		setState({
			isValidating: false,
			validationResult: null,
			error: null,
		});
	}, []);

	const clearError = useCallback(() => {
		setState((prev) => ({
			...prev,
			error: null,
		}));
	}, []);

	// Helper function to check if a file has validation errors
	const hasValidationErrors = useCallback(
		(validationResult: ValidationResult | null): boolean => {
			return validationResult ? validationResult.errors.length > 0 : false;
		},
		[]
	);

	// Helper function to get error summary
	const getErrorSummary = useCallback(
		(validationResult: ValidationResult | null): string => {
			if (!validationResult || validationResult.errors.length === 0) {
				return "";
			}

			const errorCount = validationResult.errors.length;
			const warningCount = validationResult.warnings.length;

			let summary = `${errorCount} error${errorCount !== 1 ? "s" : ""}`;
			if (warningCount > 0) {
				summary += ` and ${warningCount} warning${
					warningCount !== 1 ? "s" : ""
				}`;
			}
			summary += " found";

			return summary;
		},
		[]
	);

	// Helper function to get validation status text
	const getValidationStatus = useCallback(
		(validationResult: ValidationResult | null): string => {
			if (!validationResult) return "";

			if (validationResult.isValid) {
				return validationResult.warnings.length > 0
					? `Valid with ${validationResult.warnings.length} warning${
							validationResult.warnings.length !== 1 ? "s" : ""
					  }`
					: "Valid";
			} else {
				return "Invalid";
			}
		},
		[]
	);

	// Helper function to categorize errors by type
	const categorizeErrors = useCallback(
		(validationResult: ValidationResult | null) => {
			if (!validationResult) return {};

			const categories: Record<string, typeof validationResult.errors> = {
				missing_columns: [],
				data_type_errors: [],
				validation_errors: [],
				empty_fields: [],
			};

			validationResult.errors.forEach((error) => {
				switch (error.type) {
					case "missing_column":
						categories.missing_columns.push(error);
						break;
					case "invalid_data_type":
						categories.data_type_errors.push(error);
						break;
					case "empty_required_field":
						categories.empty_fields.push(error);
						break;
					default:
						categories.validation_errors.push(error);
						break;
				}
			});

			return categories;
		},
		[]
	);

	return {
		// State
		isValidating: state.isValidating,
		validationResult: state.validationResult,
		error: state.error,

		// Actions
		validateFileData,
		clearValidation,
		clearError,

		// Helpers
		hasValidationErrors,
		getErrorSummary,
		getValidationStatus,
		categorizeErrors,
	};
};

export type { UseFileValidationState, ValidationResult };
