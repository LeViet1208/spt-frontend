// Base API response types for the standardized response format
export interface ApiResponse<T = any> {
	success: boolean;
	message: string;
	payload: T | null;
}

// Generic success response type
export interface ApiSuccess<T> extends ApiResponse<T> {
	success: true;
	payload: T;
}

// Generic error response type
export interface ApiError extends ApiResponse<null> {
	success: false;
	payload: null;
}

// Union type for API responses
export type ApiResult<T> = ApiSuccess<T> | ApiError;

// Helper type guards
export const isApiSuccess = <T>(
	response: ApiResult<T>
): response is ApiSuccess<T> => {
	return response.success === true;
};

export const isApiError = <T>(response: ApiResult<T>): response is ApiError => {
	return response.success === false;
};

// Error details type for more structured error handling
export interface ErrorDetails {
	code?: string;
	field?: string;
	context?: Record<string, any>;
}

// Extended error type with additional details
export interface DetailedApiError extends ApiError {
	details?: ErrorDetails;
	timestamp?: string;
	requestId?: string;
}
