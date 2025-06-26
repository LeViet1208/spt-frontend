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
			_retryCount?: number;
		};

		const MAX_RETRIES = 2; // Define max retries

		if (error.response?.status === 401) {
			originalRequest._retryCount = originalRequest._retryCount || 0;

			if (originalRequest._retryCount < MAX_RETRIES) {
				originalRequest._retryCount++;
				// Retry the request
				return api(originalRequest);
			} else {
				// Max retries reached, clear authentication and redirect to login
				if (authStore) {
					authStore.getState().clearAuth();
				}

				if (
					typeof window !== "undefined" &&
					window.location.pathname !== "/login"
				) {
					window.location.href = "/login";
				}
				// Throw a specific error to indicate a redirect is initiated,
				// preventing further error processing in components.
				const redirectError = new Error("REDIRECT_INITIATED");
				(redirectError as any).isRedirect = true;
				return Promise.reject(redirectError);
			}
		}

		return Promise.reject(error); // For all other errors, or 401s that didn't trigger redirect
	}
);
