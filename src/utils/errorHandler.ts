import { AxiosError } from "axios";
import { ApiError, ApiResult, isApiError, DetailedApiError } from "./types/api";

// Very simplified error handling

// Simplified processed error interface
export interface ProcessedError {
	id: string;
	message: string;
	userMessage: string;
	code?: string;
	originalError?: any;
	shouldReport?: boolean;
	shouldDisplay?: boolean;
	retryable?: boolean;
}

// Very simplified error handler class
export class ErrorHandler {
	private static instance: ErrorHandler;
	private errorListeners: ((error: ProcessedError) => void)[] = [];
	private errorHistory: ProcessedError[] = [];
	private maxHistorySize = 100;

	private constructor() {}

	static getInstance(): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler();
		}
		return ErrorHandler.instance;
	}

	// Add error listener (for notifications, logging, etc.)
	addErrorListener(listener: (error: ProcessedError) => void): () => void {
		this.errorListeners.push(listener);

		// Return unsubscribe function
		return () => {
			const index = this.errorListeners.indexOf(listener);
			if (index > -1) {
				this.errorListeners.splice(index, 1);
			}
		};
	}

	// Process and handle different types of errors
	handleError(
		error: any,
		context?: string, // Just a simple string context
		options?: {
			defaultMessage?: string;
			shouldReport?: boolean;
			shouldDisplay?: boolean;
		}
	): ProcessedError {
		const processedError = this.processError(error, context, options);
		this.notifyListeners(processedError);
		this.addToHistory(processedError);
		return processedError;
	}

	// Process API response errors
	handleApiError<T>(
		result: ApiResult<T>,
		context?: string,
		options?: {
			defaultMessage?: string;
		}
	): ProcessedError | null {
		if (isApiError(result)) {
			return this.handleError(result, context, {
				defaultMessage: options?.defaultMessage || "An error occurred",
				shouldDisplay: true,
				shouldReport: true,
			});
		}
		return null;
	}

	// Process different error types
	private processError(
		error: any,
		context?: string,
		options?: {
			defaultMessage?: string;
			shouldReport?: boolean;
			shouldDisplay?: boolean;
		}
	): ProcessedError {
		const id = this.generateErrorId();

		// Determine error properties based on error type
		let message: string;
		let userMessage: string;
		let code: string | undefined;
		let retryable = false;

		if (this.isApiError(error)) {
			// Handle API errors from our standardized format
			message = error.message;
			userMessage = error.message;
			code = (error as DetailedApiError).details?.code;
		} else if (this.isAxiosError(error)) {
			// Handle Axios errors
			const status = error.response?.status;
			const responseData = error.response?.data;
			message =
				responseData &&
				typeof responseData === "object" &&
				"message" in responseData
					? String(responseData.message)
					: "Network error";
			userMessage = this.getAxiosUserMessage(status);
			code = status?.toString();
			retryable = this.isAxiosRetryable(status);
		} else if (error instanceof Error) {
			// Handle generic JavaScript errors
			message = error.message || "Unknown error";
			userMessage = options?.defaultMessage || "An unexpected error occurred";
		} else if (typeof error === "string") {
			// Handle string errors
			message = error;
			userMessage = error;
		} else if (error && typeof error === "object" && "message" in error) {
			// Handle objects with message property
			message = String(error.message) || "Unknown error";
			userMessage = options?.defaultMessage || "An unexpected error occurred";
		} else {
			// Handle unknown error types
			message = "Unknown error occurred";
			userMessage = options?.defaultMessage || "An unexpected error occurred";
		}

		return {
			id,
			message,
			userMessage,
			code,
			originalError: error,
			shouldReport: options?.shouldReport ?? this.shouldReportError(error),
			shouldDisplay: options?.shouldDisplay ?? this.shouldDisplayError(error),
			retryable,
		};
	}

	// Type guards
	private isApiError(error: any): error is ApiError {
		return (
			error &&
			typeof error === "object" &&
			typeof error.success === "boolean" &&
			typeof error.message === "string" &&
			error.hasOwnProperty("payload")
		);
	}

	private isAxiosError(error: any): error is AxiosError {
		return error && error.isAxiosError === true;
	}

	// Axios error helpers
	private getAxiosUserMessage(status?: number): string {
		if (!status) return "Network error. Please check your connection.";

		switch (status) {
			case 401:
				return "You need to log in to access this resource.";
			case 403:
				return "You don't have permission to perform this action.";
			case 404:
				return "The requested resource was not found.";
			case 408:
				return "Request timed out. Please try again.";
			case 429:
				return "Too many requests. Please wait a moment and try again.";
			case 500:
				return "Server error. Please try again later.";
			case 502:
			case 503:
			case 504:
				return "Server is temporarily unavailable. Please try again later.";
			default:
				return status >= 500
					? "Server error. Please try again later."
					: "An error occurred. Please try again.";
		}
	}

	private isAxiosRetryable(status?: number): boolean {
		if (!status) return true; // Network errors are retryable
		return status >= 500 || status === 408 || status === 429;
	}

	// Very simplified error reporting and display logic
	private shouldReportError(error: any): boolean {
		// Report server errors (5xx) and network errors
		if (this.isAxiosError(error)) {
			const status = error.response?.status;
			return !status || status >= 500;
		}
		return false; // Don't report client errors by default
	}

	private shouldDisplayError(error: any): boolean {
		// Don't display authentication errors as they trigger redirects
		if (this.isAxiosError(error)) {
			return error.response?.status !== 401;
		}
		return true;
	}

	// Utility methods
	private generateErrorId(): string {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private notifyListeners(error: ProcessedError): void {
		this.errorListeners.forEach((listener) => {
			try {
				listener(error);
			} catch (e) {
				console.error("Error in error listener:", e);
			}
		});
	}

	private addToHistory(error: ProcessedError): void {
		this.errorHistory.unshift(error);
		if (this.errorHistory.length > this.maxHistorySize) {
			this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
		}
	}

	// Public methods for accessing error history
	getErrorHistory(): ProcessedError[] {
		return [...this.errorHistory];
	}

	clearErrorHistory(): void {
		this.errorHistory = [];
	}
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (
	error: any,
	context?: string,
	options?: Parameters<ErrorHandler["handleError"]>[2]
) => errorHandler.handleError(error, context, options);

export const handleApiError = <T>(
	result: ApiResult<T>,
	context?: string,
	options?: Parameters<ErrorHandler["handleApiError"]>[2]
) => errorHandler.handleApiError(result, context, options);
