"use client";

import { useState, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { campaignService } from "@/utils/services/campaign";
import { handleError } from "@/utils/errorHandler";
import {
	Campaign,
	CreateCampaignRequest,
	PromotionRule,
	CreatePromotionRuleRequest,
	PromotionRuleValidationResult,
	DatasetValidationOptions,
} from "@/utils/types/campaign";

interface UpdateCampaignRequest {
	name: string;
	description?: string;
}

export const useCampaign = () => {
	const { showSuccessNotification } = useNotifications();

	const [campaigns, setCampaigns] = useState<{
		[datasetId: number]: Campaign[];
	}>({});
	const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
	const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
	const [promotionRules, setPromotionRules] = useState<{
		[campaignId: number]: PromotionRule[];
	}>({});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCampaignError = useCallback(
		(err: unknown, defaultMessage: string, context?: string) => {
			console.error(`Campaign ${context || "operation"} error:`, err);

			// Use the centralized error handler
			const processedError = handleError(err, context, {
				defaultMessage,
			});

			setError(processedError.userMessage);
		},
		[]
	);

	const fetchCampaignsByDataset = useCallback(
		async (datasetId: number) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await campaignService.getCampaignsByDataset(datasetId);
				if (response.success && response.data) {
					setCampaigns((prev) => ({ ...prev, [datasetId]: response.data! }));
				} else {
					handleCampaignError(
						new Error(response.error || "Failed to fetch campaigns"),
						response.error || "Failed to fetch campaigns",
						"fetch-campaigns-by-dataset"
					);
				}
			} catch (err) {
				handleCampaignError(
					err,
					"Failed to fetch campaigns",
					"fetch-campaigns-by-dataset"
				);
			} finally {
				setIsLoading(false);
			}
		},
		[handleError]
	);

	const fetchAllCampaigns = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await campaignService.getAllCampaigns();
			if (response.success && response.data) {
				setAllCampaigns(response.data);
				return response;
			} else {
				const errorMessage = response.error || "Failed to fetch all campaigns";
				setError(errorMessage);
				return { success: false, error: errorMessage };
			}
		} catch (err) {
			const errorMessage = "Failed to fetch all campaigns";
			handleCampaignError(err, errorMessage, "fetch-all-campaigns");
			return { success: false, error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [handleCampaignError]);

	const createCampaign = useCallback(
		async (request: CreateCampaignRequest) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await campaignService.createCampaign(request);
				if (response.success && response.data) {
					const campaign = response.data;

					// Update dataset-specific campaigns
					setCampaigns((prev) => ({
						...prev,
						[request.dataset_id]: prev[request.dataset_id]
							? [campaign, ...prev[request.dataset_id]]
							: [campaign],
					}));

					// Update all campaigns
					setAllCampaigns((prev) => [campaign, ...prev]);

					showSuccessNotification("Campaign created successfully!");
					return campaign;
				} else {
					handleCampaignError(
						new Error(response.error),
						response.error || "Failed to create campaign",
						"create-campaign"
					);
					return null;
				}
			} catch (err) {
				handleCampaignError(
					err,
					"Failed to create campaign",
					"create-campaign"
				);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleCampaignError, showSuccessNotification]
	);

	const updateCampaign = useCallback(
		async (campaignId: number, request: UpdateCampaignRequest) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await campaignService.updateCampaign(
					campaignId,
					request
				);
				if (response.success && response.data) {
					const updatedCampaign = response.data;

					// Update dataset-specific campaigns
					setCampaigns((prev) => {
						const updated = { ...prev };
						Object.keys(updated).forEach((datasetId) => {
							updated[parseInt(datasetId)] = updated[parseInt(datasetId)].map(
								(campaign) =>
									campaign.campaign_id === campaignId
										? updatedCampaign
										: campaign
							);
						});
						return updated;
					});

					// Update all campaigns
					setAllCampaigns((prev) =>
						prev.map((campaign) =>
							campaign.campaign_id === campaignId ? updatedCampaign : campaign
						)
					);

					// Update current campaign if it's the one being updated
					if (currentCampaign?.campaign_id === campaignId) {
						setCurrentCampaign(updatedCampaign);
					}

					showSuccessNotification("Campaign updated successfully!");
					return updatedCampaign;
				} else {
					handleCampaignError(
						new Error(response.error),
						response.error || "Failed to update campaign",
						"update-campaign"
					);
					return null;
				}
			} catch (err) {
				handleCampaignError(
					err,
					"Failed to update campaign",
					"update-campaign"
				);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleCampaignError, showSuccessNotification, currentCampaign]
	);

	const fetchPromotionRules = useCallback(
		async (campaignId: number) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await campaignService.getPromotionRules(campaignId);
				if (response.success && response.data) {
					setPromotionRules((prev) => ({
						...prev,
						[campaignId]: response.data!,
					}));
					return response;
				} else {
					const errorMessage =
						response.error || "Failed to fetch promotion rules";
					setError(errorMessage);
					return { success: false, error: errorMessage };
				}
			} catch (err) {
				const errorMessage = "Failed to fetch promotion rules";
				handleCampaignError(err, errorMessage, "fetch-promotion-rules");
				return { success: false, error: errorMessage };
			} finally {
				setIsLoading(false);
			}
		},
		[handleCampaignError]
	);

	const createPromotionRule = useCallback(
		async (campaignId: number, request: CreatePromotionRuleRequest) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await campaignService.createPromotionRule(
					campaignId,
					request
				);
				if (response.success && response.data) {
					const promotionRule = response.data;

					// Update promotion rules for this campaign
					setPromotionRules((prev) => ({
						...prev,
						[campaignId]: prev[campaignId]
							? [promotionRule, ...prev[campaignId]]
							: [promotionRule],
					}));

					showSuccessNotification("Promotion rule created successfully!");
					return promotionRule;
				} else {
					handleCampaignError(
						new Error(response.error),
						response.error || "Failed to create promotion rule",
						"create-promotion-rule"
					);
					return null;
				}
			} catch (err) {
				handleCampaignError(
					err,
					"Failed to create promotion rule",
					"create-promotion-rule"
				);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleCampaignError, showSuccessNotification]
	);

	const validatePromotionRule = useCallback(
		async (
			campaignId: number,
			request: Omit<CreatePromotionRuleRequest, "name">
		) => {
			setError(null);
			try {
				const response = await campaignService.validatePromotionRule(
					campaignId,
					request
				);
				if (response.success && response.data) {
					return response.data;
				} else {
					const errorMessage =
						response.error || "Failed to validate promotion rule";
					setError(errorMessage);
					return null;
				}
			} catch (err) {
				const errorMessage = "Failed to validate promotion rule";
				handleCampaignError(err, errorMessage, "validate-promotion-rule");
				return null;
			}
		},
		[handleCampaignError]
	);

	const getDatasetValidationOptions = useCallback(
		async (
			datasetId: number,
			options?: {
				store_id?: string;
				category?: string;
				targetType?: string;
				search?: string;
				page?: number;
				limit?: number;
				for_demand_decomposition?: boolean;
			}
		): Promise<{
			success: boolean;
			data?: DatasetValidationOptions;
			error?: string;
		}> => {
			setError(null);
			try {
				const response = await campaignService.getDatasetValidationOptions(
					datasetId,
					options
				);
				if (response.success && response.data) {
					return response;
				} else {
					const errorMessage =
						response.error || "Failed to get validation options";
					setError(errorMessage);
					return { success: false, error: errorMessage };
				}
			} catch (err) {
				const errorMessage = "Failed to get validation options";
				handleCampaignError(err, errorMessage, "get-validation-options");
				return { success: false, error: errorMessage };
			}
		},
		[handleCampaignError]
	);

	const getPromotionRule = useCallback(
		async (campaignId: number, ruleId: number) => {
			setError(null);
			try {
				const response = await campaignService.getPromotionRule(
					campaignId,
					ruleId
				);
				if (response.success && response.data) {
					return response.data;
				} else {
					const errorMessage = response.error || "Failed to get promotion rule";
					setError(errorMessage);
					return null;
				}
			} catch (err) {
				const errorMessage = "Failed to get promotion rule";
				handleCampaignError(err, errorMessage, "get-promotion-rule");
				return null;
			}
		},
		[handleCampaignError]
	);

	const updatePromotionRule = useCallback(
		async (
			campaignId: number,
			ruleId: number,
			request: CreatePromotionRuleRequest
		) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await campaignService.updatePromotionRule(
					campaignId,
					ruleId,
					request
				);
				if (response.success && response.data) {
					const updatedRule = response.data;

					// Update promotion rules for this campaign
					setPromotionRules((prev) => ({
						...prev,
						[campaignId]: prev[campaignId]
							? prev[campaignId].map((rule) =>
									rule.promotion_rule_id === ruleId ? updatedRule : rule
							  )
							: [updatedRule],
					}));

					showSuccessNotification("Promotion rule updated successfully!");
					return updatedRule;
				} else {
					handleCampaignError(
						new Error(response.error),
						response.error || "Failed to update promotion rule",
						"update-promotion-rule"
					);
					return null;
				}
			} catch (err) {
				handleCampaignError(
					err,
					"Failed to update promotion rule",
					"update-promotion-rule"
				);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleCampaignError, showSuccessNotification]
	);

	const deletePromotionRule = useCallback(
		async (campaignId: number, ruleId: number) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await campaignService.deletePromotionRule(
					campaignId,
					ruleId
				);
				if (response.success && response.data) {
					// Remove the rule from promotion rules for this campaign
					setPromotionRules((prev) => ({
						...prev,
						[campaignId]: prev[campaignId]
							? prev[campaignId].filter(
									(rule) => rule.promotion_rule_id !== ruleId
							  )
							: [],
					}));

					showSuccessNotification("Promotion rule deleted successfully!");
					return response.data;
				} else {
					handleCampaignError(
						new Error(response.error),
						response.error || "Failed to delete promotion rule",
						"delete-promotion-rule"
					);
					return null;
				}
			} catch (err) {
				handleCampaignError(
					err,
					"Failed to delete promotion rule",
					"delete-promotion-rule"
				);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleCampaignError, showSuccessNotification]
	);

	const getCampaignsForDataset = useCallback(
		(datasetId: number) => {
			if (!campaigns[datasetId] && !isLoading) {
				fetchCampaignsByDataset(datasetId);
			}
			return {
				campaigns: campaigns[datasetId] || [],
				isLoading,
				error,
			};
		},
		[campaigns, isLoading, error, fetchCampaignsByDataset]
	);

	const getPromotionRulesForCampaign = useCallback(
		(campaignId: number) => {
			if (!promotionRules[campaignId] && !isLoading) {
				fetchPromotionRules(campaignId);
			}
			return {
				promotionRules: promotionRules[campaignId] || [],
				isLoading,
				error,
			};
		},
		[promotionRules, isLoading, error, fetchPromotionRules]
	);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const resetState = useCallback(() => {
		setCampaigns({});
		setAllCampaigns([]);
		setCurrentCampaign(null);
		setPromotionRules({});
		setError(null);
	}, []);

	return {
		// State
		campaigns,
		allCampaigns,
		currentCampaign,
		promotionRules,
		isLoading,
		error,

		// Methods
		fetchCampaignsByDataset,
		fetchAllCampaigns,
		createCampaign,
		updateCampaign,
		fetchPromotionRules,
		createPromotionRule,
		validatePromotionRule,
		getDatasetValidationOptions,
		getPromotionRule,
		updatePromotionRule,
		deletePromotionRule,

		// Helper methods
		getCampaignsForDataset,
		getPromotionRulesForCampaign,

		// Utility methods
		clearError,
		resetState,
	};
};
