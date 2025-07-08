"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { decompositionService } from "@/utils/services/decomposition";
import {
	DecompositionAnalysisRequest,
	DecompositionAnalysisResponse,
	DecompositionStatusResponse,
	DecompositionHistoryRequest,
	DecompositionHistoryResponse,
	DecompositionCacheEntry,
	ComparisonScenario,
	DecompositionFilters,
	DecompositionSortOptions,
	DecompositionExportData,
} from "@/utils/types/decomposition";

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 50;

export const useDecompositionAnalytics = (datasetId?: string) => {
	const { showErrorNotification, showSuccessNotification } = useNotifications();

	// Core state
	const [analysisData, setAnalysisData] =
		useState<DecompositionAnalysisResponse | null>(null);
	const [historyData, setHistoryData] =
		useState<DecompositionHistoryResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Polling state for status checking
	const [pollingRequestId, setPollingRequestId] = useState<number | null>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Comparison state
	const [comparisonScenarios, setComparisonScenarios] = useState<
		ComparisonScenario[]
	>([]);

	// Filtering and sorting state
	const [filters, setFilters] = useState<DecompositionFilters>({});
	const [sortOptions, setSortOptions] = useState<DecompositionSortOptions>({
		field: "percentage_change",
		direction: "desc",
	});

	// Cache for storing analysis results
	const cacheRef = useRef<Map<string, DecompositionCacheEntry>>(new Map());

	// Clear polling on unmount
	useEffect(() => {
		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, []);

	// Cache management
	const getCachedResult = useCallback(
		(
			request: DecompositionAnalysisRequest
		): DecompositionAnalysisResponse | null => {
			const key = decompositionService.generateCacheKey(request);
			const cached = cacheRef.current.get(key);

			if (cached && cached.expiresAt > Date.now()) {
				return cached.data;
			}

			if (cached) {
				cacheRef.current.delete(key);
			}

			return null;
		},
		[]
	);

	const setCachedResult = useCallback(
		(
			request: DecompositionAnalysisRequest,
			data: DecompositionAnalysisResponse
		) => {
			const key = decompositionService.generateCacheKey(request);
			const entry: DecompositionCacheEntry = {
				key,
				data,
				timestamp: Date.now(),
				expiresAt: Date.now() + CACHE_DURATION,
			};

			// Remove oldest entries if cache is full
			if (cacheRef.current.size >= MAX_CACHE_SIZE) {
				const oldestKey = Array.from(cacheRef.current.entries()).sort(
					([, a], [, b]) => a.timestamp - b.timestamp
				)[0][0];
				cacheRef.current.delete(oldestKey);
			}

			cacheRef.current.set(key, entry);
		},
		[]
	);

	const clearCache = useCallback(() => {
		cacheRef.current.clear();
	}, []);

	// Status polling
	const startPolling = useCallback(
		(requestId: number) => {
			setPollingRequestId(requestId);

			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}

			pollingIntervalRef.current = setInterval(async () => {
				try {
					const response = await decompositionService.getDecompositionStatus(
						requestId
					);

					if (response.success && response.data) {
						const status = response.data.status;

						if (status === "completed") {
							if (response.data.results) {
								setAnalysisData(response.data.results);
								showSuccessNotification("Analysis completed successfully");
							}
							stopPolling();
						} else if (status === "failed") {
							setError("Analysis failed");
							showErrorNotification("Analysis failed");
							stopPolling();
						}
					}
				} catch (err) {
					console.error("Polling error:", err);
				}
			}, 3000); // Poll every 3 seconds
		},
		[showErrorNotification, showSuccessNotification]
	);

	const stopPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		setPollingRequestId(null);
	}, []);

	// Main analysis function
	const analyzeDecomposition = useCallback(
		async (request: DecompositionAnalysisRequest) => {
			if (!datasetId) {
				setError("Dataset ID is required");
				return;
			}

			// Validate request
			const validation = decompositionService.validateRequest(request);
			if (!validation.valid) {
				setError(validation.errors.join(", "));
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				// Check cache first
				const cachedResult = getCachedResult(request);
				if (cachedResult) {
					setAnalysisData(cachedResult);
					setIsLoading(false);
					showSuccessNotification("Analysis loaded from cache");
					return;
				}

				const response = await decompositionService.analyzeDecomposition(
					datasetId,
					request
				);

				if (response.success && response.data) {
					setAnalysisData(response.data);
					setCachedResult(request, response.data);
					showSuccessNotification("Analysis completed successfully");
				} else {
					const errorMessage =
						response.error || "Failed to analyze decomposition";
					setError(errorMessage);
					showErrorNotification(errorMessage);
				}
			} catch (err) {
				const errorMessage = "Failed to analyze decomposition";
				setError(errorMessage);
				showErrorNotification(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[
			datasetId,
			getCachedResult,
			setCachedResult,
			showErrorNotification,
			showSuccessNotification,
		]
	);

	// Get analysis history
	const fetchHistory = useCallback(
		async (filters?: DecompositionHistoryRequest) => {
			if (!datasetId) {
				setError("Dataset ID is required");
				return;
			}

			try {
				const response = await decompositionService.getDecompositionHistory(
					datasetId,
					filters
				);

				if (response.success && response.data) {
					setHistoryData(response.data);
				} else {
					const errorMessage = response.error || "Failed to fetch history";
					setError(errorMessage);
					showErrorNotification(errorMessage);
				}
			} catch (err) {
				const errorMessage = "Failed to fetch history";
				setError(errorMessage);
				showErrorNotification(errorMessage);
			}
		},
		[datasetId, showErrorNotification]
	);

	// Comparison functions
	const addComparisonScenario = useCallback(
		(name: string, request: DecompositionAnalysisRequest) => {
			const scenario: ComparisonScenario = {
				id: `scenario_${Date.now()}`,
				name,
				request,
				status: "pending",
			};
			setComparisonScenarios((prev) => [...prev, scenario]);
			return scenario.id;
		},
		[]
	);

	const removeComparisonScenario = useCallback((scenarioId: string) => {
		setComparisonScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
	}, []);

	const runComparisonScenario = useCallback(
		async (scenarioId: string) => {
			if (!datasetId) return;

			setComparisonScenarios((prev) =>
				prev.map((s) => (s.id === scenarioId ? { ...s, status: "loading" } : s))
			);

			const scenario = comparisonScenarios.find((s) => s.id === scenarioId);
			if (!scenario) return;

			try {
				const response = await decompositionService.analyzeDecomposition(
					datasetId,
					scenario.request
				);

				if (response.success && response.data) {
					setComparisonScenarios((prev) =>
						prev.map((s) =>
							s.id === scenarioId
								? { ...s, status: "completed", response: response.data }
								: s
						)
					);
				} else {
					setComparisonScenarios((prev) =>
						prev.map((s) =>
							s.id === scenarioId
								? { ...s, status: "error", error: response.error }
								: s
						)
					);
				}
			} catch (err) {
				setComparisonScenarios((prev) =>
					prev.map((s) =>
						s.id === scenarioId
							? { ...s, status: "error", error: "Analysis failed" }
							: s
					)
				);
			}
		},
		[datasetId, comparisonScenarios]
	);

	const clearComparisonScenarios = useCallback(() => {
		setComparisonScenarios([]);
	}, []);

	// Filtering and sorting
	const getFilteredAndSortedResults = useCallback(() => {
		if (!analysisData) return [];

		let results = Object.entries(analysisData.decomposition_analysis);

		// Apply filters
		if (filters.confidenceLevel) {
			results = results.filter(
				([, result]) => result.confidence_level === filters.confidenceLevel
			);
		}

		if (filters.changeType && filters.changeType !== "all") {
			results = results.filter(([, result]) => {
				if (filters.changeType === "positive")
					return result.percentage_change > 0;
				if (filters.changeType === "negative")
					return result.percentage_change < 0;
				return true;
			});
		}

		if (filters.minimumChange) {
			results = results.filter(
				([, result]) =>
					Math.abs(result.percentage_change) >= filters.minimumChange!
			);
		}

		// Apply sorting
		results.sort(([, a], [, b]) => {
			let valueA: number | string;
			let valueB: number | string;

			switch (sortOptions.field) {
				case "name":
					valueA = a.name;
					valueB = b.name;
					break;
				case "percentage_change":
					valueA = a.percentage_change;
					valueB = b.percentage_change;
					break;
				case "absolute_change":
					valueA = a.absolute_change;
					valueB = b.absolute_change;
					break;
				case "confidence_level":
					valueA =
						a.confidence_level === "high"
							? 3
							: a.confidence_level === "medium"
							? 2
							: 1;
					valueB =
						b.confidence_level === "high"
							? 3
							: b.confidence_level === "medium"
							? 2
							: 1;
					break;
				default:
					return 0;
			}

			if (typeof valueA === "string" && typeof valueB === "string") {
				return sortOptions.direction === "asc"
					? valueA.localeCompare(valueB)
					: valueB.localeCompare(valueA);
			}

			return sortOptions.direction === "asc"
				? (valueA as number) - (valueB as number)
				: (valueB as number) - (valueA as number);
		});

		return results;
	}, [analysisData, filters, sortOptions]);

	// Export functions
	const exportToCSV = useCallback(() => {
		if (!analysisData) return;

		const results = getFilteredAndSortedResults();
		const exportData: DecompositionExportData[] = results.map(
			([categoryKey, result]) => ({
				analysis_id: analysisData.analysis_id,
				target_upc: analysisData.target_parameters.upc,
				target_store_id: analysisData.target_parameters.store_id,
				target_category: analysisData.target_parameters.category,
				target_brand: analysisData.target_parameters.brand,
				campaign_period: `${analysisData.target_parameters.time_period.start_time} to ${analysisData.target_parameters.time_period.end_time}`,
				category_name: result.name,
				category_description: result.description,
				percentage_change: result.percentage_change,
				absolute_change: result.absolute_change,
				confidence_level: result.confidence_level,
				baseline_demand: result.baseline_demand,
				campaign_demand: result.campaign_demand,
				decomposition_demand: result.decomposition_demand,
				analysis_date: analysisData.metadata.analysis_date,
				campaign_name: analysisData.metadata.campaign_name,
			})
		);

		const headers = Object.keys(exportData[0]).join(",");
		const rows = exportData.map((row) => Object.values(row).join(","));
		const csv = [headers, ...rows].join("\n");

		const blob = new Blob([csv], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `decomposition_analysis_${analysisData.analysis_id}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);

		showSuccessNotification("Data exported to CSV");
	}, [analysisData, getFilteredAndSortedResults, showSuccessNotification]);

	// Utility functions
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const resetState = useCallback(() => {
		setAnalysisData(null);
		setHistoryData(null);
		setError(null);
		stopPolling();
		clearComparisonScenarios();
	}, [stopPolling, clearComparisonScenarios]);

	return {
		// Core state
		analysisData,
		historyData,
		isLoading,
		error,

		// Polling state
		pollingRequestId,

		// Comparison state
		comparisonScenarios,

		// Filter and sort state
		filters,
		sortOptions,

		// Core actions
		analyzeDecomposition,
		fetchHistory,

		// Polling actions
		startPolling,
		stopPolling,

		// Comparison actions
		addComparisonScenario,
		removeComparisonScenario,
		runComparisonScenario,
		clearComparisonScenarios,

		// Filter and sort actions
		setFilters,
		setSortOptions,
		getFilteredAndSortedResults,

		// Export actions
		exportToCSV,

		// Cache actions
		clearCache,

		// Utility actions
		clearError,
		resetState,
	};
};
