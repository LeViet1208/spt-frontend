import { auth } from "@/utils/firebase";

// Campaign API service - Updated to match backend response format
export interface Campaign {
	campaign_id: number;
	name: string;
	description?: string;
	dataset_id?: number;
	created_at: string;
	updated_at: string;
	is_active: boolean;
	promotion_rules_count: number;
	dataset?: {
		dataset_id: number;
		name?: string;
		description?: string;
	};
}

export interface PromotionRule {
	promotion_rule_id: number;
	name: string;
	rule_type: "price_reduction";
	target_type: "category" | "brand" | "upc";
	target_upcs?: string[];
	target_brands?: string[];
	target_categories?: string[];
	price_reduction_percentage?: number;
	price_reduction_amount?: number;
	size_increase_percentage?: number;
	feature_enabled?: boolean;
	display_enabled?: boolean;
	start_date: number;
	end_date: number;
	created_at: string;
	updated_at: string;
	is_active: boolean;
}

export interface CampaignResponse {
	success: boolean;
	data?: Campaign[];
	error?: string;
}

export interface CreateCampaignRequest {
	name: string;
	dataset_id: number;
}

export interface CreatePromotionRuleRequest {
	name: string;
	rule_type: "price_reduction";
	target_type: "category" | "brand" | "upc";
	start_date: number;
	end_date: number;
	target_categories?: string[];
	target_brands?: string[];
	target_upcs?: string[];
	price_reduction_percentage?: number;
	price_reduction_amount?: number;
	size_increase_percentage?: number;
	feature_enabled?: boolean;
	display_enabled?: boolean;
}

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
	try {
		// First try to get access token from localStorage
		let accessToken = localStorage.getItem("access_token");
		console.log(
			"🔍 [Auth Debug] Access token from localStorage:",
			accessToken ? `${accessToken.substring(0, 20)}...` : "null"
		);

		// If no access token, exchange Firebase ID token for access token
		if (!accessToken) {
			console.log(
				"🔍 [Auth Debug] No access token found, exchanging Firebase ID token"
			);

			// Get Firebase ID token
			let firebaseIdToken = sessionStorage.getItem("firebaseIdToken");

			// If no Firebase token in session, get fresh one
			if (!firebaseIdToken && auth.currentUser) {
				console.log("🔍 [Auth Debug] Getting fresh Firebase ID token");
				firebaseIdToken = await auth.currentUser.getIdToken();
				sessionStorage.setItem("firebaseIdToken", firebaseIdToken);
			}

			if (!firebaseIdToken) {
				console.error("❌ [Auth Debug] No Firebase ID token available");
				return { "Content-Type": "application/json" };
			}

			console.log("🔍 [Auth Debug] Exchanging Firebase token for access token");

			// Exchange Firebase ID token for access token
			const authResponse = await fetch("http://localhost:8000/auth", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					firebase_id_token: firebaseIdToken,
				}),
			});

			if (!authResponse.ok) {
				console.error(
					"❌ [Auth Debug] Failed to exchange token:",
					authResponse.status
				);
				return { "Content-Type": "application/json" };
			}

			const authData = await authResponse.json();
			accessToken = authData.access_token;

			// Store access token for future use
			if (accessToken) {
				localStorage.setItem("access_token", accessToken);
				localStorage.setItem("user_id", authData.user_id);
				console.log("✅ [Auth Debug] Access token obtained and stored");
			}
		}

		if (!accessToken) {
			console.error("❌ [Auth Debug] No access token available");
			return { "Content-Type": "application/json" };
		}

		const headers = {
			"Content-Type": "application/json",
			Authorization: `Token ${accessToken}`,
		};

		console.log("🔍 [Auth Debug] Final headers:", {
			...headers,
			Authorization: `Token ${accessToken.substring(0, 20)}...`,
		});

		return headers;
	} catch (error) {
		console.error("❌ [Auth Debug] Error in getAuthHeaders:", error);
		return { "Content-Type": "application/json" };
	}
};

// Real API functions using the actual backend endpoints
export const campaignAPI = {
	// Get campaigns by dataset ID
	async getCampaignsByDataset(datasetId: number): Promise<CampaignResponse> {
		try {
			const headers = await getAuthHeaders();
			const response = await fetch(
				`http://localhost:8000/datasets/${datasetId}/campaigns`,
				{
					method: "GET",
					headers,
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return {
				success: true,
				data: data.campaigns || [],
			};
		} catch (error) {
			console.error("Error fetching campaigns by dataset:", error);
			return {
				success: false,
				error:
					"Failed to fetch campaigns. Please check your connection and try again.",
			};
		}
	},

	// Get all campaigns for the current user
	async getAllCampaigns(): Promise<CampaignResponse> {
		try {
			const user = auth.currentUser;
			if (!user) {
				return {
					success: false,
					error: "User not authenticated",
				};
			}

			const headers = await getAuthHeaders();
			const response = await fetch(
				`http://localhost:8000/users/${user.uid}/campaigns`,
				{
					method: "GET",
					headers,
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return {
				success: true,
				data: data.campaigns || [],
			};
		} catch (error) {
			console.error("Error fetching all campaigns:", error);
			return {
				success: false,
				error:
					"Failed to fetch campaigns. Please check your connection and try again.",
			};
		}
	},

	// Create new campaign
	async createCampaign(
		request: CreateCampaignRequest
	): Promise<{ success: boolean; data?: Campaign; error?: string }> {
		try {
			const headers = await getAuthHeaders();
			const response = await fetch(
				`http://localhost:8000/datasets/${request.dataset_id}/campaigns`,
				{
					method: "POST",
					headers,
					body: JSON.stringify({ name: request.name }),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Transform response to match Campaign interface
			const campaign: Campaign = {
				campaign_id: data.campaign_id,
				name: data.name,
				description: data.description,
				dataset_id: data.dataset_id,
				created_at: data.created_at,
				updated_at: data.created_at,
				is_active: true,
				promotion_rules_count: 0,
			};

			return {
				success: true,
				data: campaign,
			};
		} catch (error) {
			console.error("Error creating campaign:", error);
			return {
				success: false,
				error: "Failed to create campaign. Please try again.",
			};
		}
	},

	// Get promotion rules for a campaign
	async getPromotionRules(
		campaignId: number
	): Promise<{ success: boolean; data?: PromotionRule[]; error?: string }> {
		try {
			const headers = await getAuthHeaders();
			const response = await fetch(
				`http://localhost:8000/campaigns/${campaignId}/promotionrules`,
				{
					method: "GET",
					headers,
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return {
				success: true,
				data: data.promotion_rules || [],
			};
		} catch (error) {
			console.error("Error fetching promotion rules:", error);
			return {
				success: false,
				error: "Failed to fetch promotion rules. Please try again.",
			};
		}
	},

	// Create promotion rule for a campaign
	async createPromotionRule(
		campaignId: number,
		request: CreatePromotionRuleRequest
	): Promise<{ success: boolean; data?: PromotionRule; error?: string }> {
		try {
			const headers = await getAuthHeaders();
			const response = await fetch(
				`http://localhost:8000/campaigns/${campaignId}/promotionrules`,
				{
					method: "POST",
					headers,
					body: JSON.stringify(request),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return {
				success: true,
				data: data,
			};
		} catch (error) {
			console.error("Error creating promotion rule:", error);
			return {
				success: false,
				error: "Failed to create promotion rule. Please try again.",
			};
		}
	},
};
