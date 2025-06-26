import axios, {
	AxiosResponse,
	InternalAxiosRequestConfig,
	AxiosError,
} from "axios";

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

			if (accessToken && config.headers) {
				config.headers["Authorization"] = `Token ${accessToken}`;
			}

			// Add user_id to request body for backend authentication
			if (userId && config.method?.toLowerCase() !== "get") {
				if (config.data && typeof config.data === "object") {
					config.data = { ...config.data, user_id: userId };
				} else if (!config.data) {
					config.data = { user_id: userId };
				}
			}
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

api.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & {
			_retry?: boolean;
		};

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			// Check if it's an invalid Firebase ID token error
			if (
				error.response?.data &&
				typeof error.response.data === "string" &&
				error.response.data.includes("Invalid Firebase ID token")
			) {
				// Clear authentication and redirect to login
				if (authStore) {
					authStore.getState().clearAuth();
				}

				if (
					typeof window !== "undefined" &&
					window.location.pathname !== "/login"
				) {
					window.location.href = "/login";
				}
				return Promise.reject(error);
			}

			// For other 401 errors, also clear auth and redirect
			if (authStore) {
				authStore.getState().clearAuth();
			}

			if (
				typeof window !== "undefined" &&
				window.location.pathname !== "/login"
			) {
				window.location.href = "/login";
			}

			return Promise.reject(error);
		}

		return Promise.reject(error);
	}
);
