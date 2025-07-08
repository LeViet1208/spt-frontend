import axios, {
	AxiosResponse,
	InternalAxiosRequestConfig,
	AxiosError,
} from "axios";
import axiosRetry from "axios-retry";
import { ApiResult, ApiResponse, isApiSuccess, isApiError } from "./types/api";
import { handleError } from "./errorHandler";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 15000,
});

// Store reference to avoid circular dependency issues
let authStore: any = null;

// Initialize auth store reference
export const initializeAuthStore = (store: any) => {
	authStore = store;
};

api.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		if (typeof window !== "undefined") {
			const accessToken = localStorage.getItem("access_token");
			const userId = localStorage.getItem("user_id");

			console.log("Request Config:", {
				url: config.url,
				headers: config.headers,
				accessToken: accessToken ? "present" : "missing",
				userId: userId ? "present" : "missing",
			});

			if (accessToken && config.headers) {
				config.headers["Authorization"] = `Token ${accessToken}`;
			}

			// Add user_id to request body for backend authentication
			if (userId && config.method?.toLowerCase() !== "get") {
				// Handle FormData separately (for file uploads)
				if (config.data instanceof FormData) {
					// user_id is already added directly to FormData in the service methods
					// Don't modify FormData here to avoid corrupting it
					// Also ensure Content-Type is not set to application/json for FormData
					if (
						config.headers &&
						config.headers["Content-Type"] === "application/json"
					) {
						delete config.headers["Content-Type"];
					}
				} else if (config.data && typeof config.data === "object") {
					config.data = { ...config.data, user_id: userId };
				} else if (!config.data) {
					config.data = { user_id: userId };
				}
			}
		}
		return config;
	},
	(error) => {
		console.error("Request Interceptor Error:", error);
		return Promise.reject(error);
	}
);

// Configure axios-retry
// axiosRetry(api, {
// 	retries: 3, // Number of retry attempts
// 	retryDelay: (retryCount) => retryCount * 1000, // Exponential backoff
// 	retryCondition: (error) => {
// 		return (
// 			axiosRetry.isNetworkOrIdempotentRequestError(error) ||
// 			error.response?.status === 500
// 		);
// 	},
// 	onRetry: (retryCount, error, requestConfig) => {
// 		console.log(`Retrying request to ${requestConfig.url} (${retryCount}/3)`);
// 	},
// });

api.interceptors.response.use(
	(response: AxiosResponse<ApiResponse>) => {
		// For standardized API responses, return the response as-is
		// The calling code will handle success/error based on the 'success' field
		return response;
	},
	(error: AxiosError) => {
		// Handle network errors and non-standardized responses
		const processedError = handleError(error, "api-interceptor-request");

		// Handle authentication errors by redirecting to login
		if (error.response?.status === 401) {
			// Give a small delay to allow error notifications to show
			setTimeout(() => {
				window.location.href = "/login";
			}, 3000);
		}

		// Return the processed error for the calling code to handle
		return Promise.reject(processedError);
	}
);

// Utility functions for handling standardized API responses
export const handleApiResponse = async <T>(
	apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<ApiResult<T>> => {
	try {
		const response = await apiCall();
		const data = response.data;

		// Return the standardized response format
		return {
			success: data.success,
			message: data.message,
			payload: data.payload,
		} as ApiResult<T>;
	} catch (error: any) {
		// Handle processed errors from interceptor
		if (error.userMessage) {
			return {
				success: false,
				message: error.userMessage,
				payload: null,
			} as ApiResult<T>;
		}

		// Handle unexpected errors
		const processedError = handleError(
			error,
			"api-handler-response-processing"
		);

		return {
			success: false,
			message: processedError.userMessage,
			payload: null,
		} as ApiResult<T>;
	}
};

// Helper for making GET requests
export const apiGet = async <T>(
	url: string,
	config?: any
): Promise<ApiResult<T>> => {
	return handleApiResponse(() => api.get<ApiResponse<T>>(url, config));
};

// Helper for making POST requests
export const apiPost = async <T>(
	url: string,
	data?: any,
	config?: any
): Promise<ApiResult<T>> => {
	return handleApiResponse(() => api.post<ApiResponse<T>>(url, data, config));
};

// Helper for making PUT requests
export const apiPut = async <T>(
	url: string,
	data?: any,
	config?: any
): Promise<ApiResult<T>> => {
	return handleApiResponse(() => api.put<ApiResponse<T>>(url, data, config));
};

// Helper for making DELETE requests
export const apiDelete = async <T>(
	url: string,
	config?: any
): Promise<ApiResult<T>> => {
	return handleApiResponse(() => api.delete<ApiResponse<T>>(url, config));
};

export default api;
