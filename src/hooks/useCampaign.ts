"use client";

import { useState, useCallback } from "react";
import { AxiosError } from "axios";
import { useToast } from "@/hooks/useToast";
import { campaignService } from "@/utils/services/campaign";
import {
	Campaign,
	CreateCampaignRequest,
	PromotionRule,
	CreatePromotionRuleRequest,
} from "@/utils/types/campaign";

export const useCampaign = () => {
	const { showSuccessToast, showErrorToast } = useToast();

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

	const handleError = useCallback(
		(err: unknown, defaultMessage: string) => {
			console.error(err);
			const axiosError = err as AxiosError<{ message?: string }>;
			const message = axiosError?.response?.data?.message || defaultMessage;
			setError(message);
			showErrorToast(message);
		},
		[showErrorToast]
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
					handleError(
						new Error(response.error),
						response.error || "Failed to fetch campaigns"
					);
				}
			} catch (err) {
				handleError(err, "Failed to fetch campaigns");
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
			} else {
				handleError(
					new Error(response.error),
					response.error || "Failed to fetch all campaigns"
				);
			}
		} catch (err) {
			handleError(err, "Failed to fetch all campaigns");
		} finally {
			setIsLoading(false);
		}
	}, [handleError]);

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

					showSuccessToast("Campaign created successfully!");
					return campaign;
				} else {
					handleError(
						new Error(response.error),
						response.error || "Failed to create campaign"
					);
					return null;
				}
			} catch (err) {
				handleError(err, "Failed to create campaign");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleError, showSuccessToast]
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
					return response.data;
				} else {
					handleError(
						new Error(response.error),
						response.error || "Failed to fetch promotion rules"
					);
					return null;
				}
			} catch (err) {
				handleError(err, "Failed to fetch promotion rules");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleError]
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

					showSuccessToast("Promotion rule created successfully!");
					return promotionRule;
				} else {
					handleError(
						new Error(response.error),
						response.error || "Failed to create promotion rule"
					);
					return null;
				}
			} catch (err) {
				handleError(err, "Failed to create promotion rule");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[handleError, showSuccessToast]
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
		fetchPromotionRules,
		createPromotionRule,

		// Helper methods
		getCampaignsForDataset,
		getPromotionRulesForCampaign,

		// Utility methods
		clearError,
		resetState,
	};
};
