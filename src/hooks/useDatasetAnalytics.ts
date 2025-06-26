"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { datasetService } from "@/utils/services/dataset";
import {
	VariableStats,
	NumericalStats,
	CategoricalStats,
	ProcessedStats,
	ProcessedNumericalStats,
	ProcessedCategoricalStats,
	HistogramDataPoint,
	ChildTable,
	Variable,
} from "@/utils/types/dataset";

// Child table definitions
export const CHILD_TABLES: ChildTable[] = [
	{ key: "transactions", label: "Transactions" },
	{ key: "productlookups", label: "Product Lookups" },
	{ key: "causallookups", label: "Causal Lookups" },
];

// Variable definitions for each child table
export const VARIABLES_BY_TABLE: { [key: string]: Variable[] } = {
	transactions: [
		{ key: "upc", label: "UPC", type: "categorical" },
		{ key: "dollar_sales", label: "Dollar Sales", type: "numerical" },
		{ key: "units", label: "Unit Sales", type: "numerical" },
		{
			key: "time_of_transaction",
			label: "Time of Transaction",
			type: "categorical",
		},
		{ key: "day", label: "Day", type: "categorical" },
		{ key: "week", label: "Week", type: "categorical" },
		{ key: "store", label: "Store", type: "categorical" },
		{ key: "geography", label: "Geography", type: "categorical" },
		{ key: "basket", label: "Basket", type: "categorical" },
		{ key: "household", label: "Household", type: "categorical" },
		{ key: "coupon", label: "Coupon", type: "categorical" },
	],
	productlookups: [
		{ key: "upc", label: "UPC", type: "categorical" },
		{
			key: "product_description",
			label: "Product Description",
			type: "categorical",
		},
		{ key: "commodity", label: "Commodity", type: "categorical" },
		{ key: "brand", label: "Brand", type: "categorical" },
		{ key: "product_size", label: "Product Size", type: "numerical" },
	],
	causallookups: [
		{ key: "upc", label: "UPC", type: "categorical" },
		{ key: "week", label: "Week", type: "categorical" },
		{ key: "store", label: "Store", type: "categorical" },
		{ key: "geography", label: "Geography", type: "categorical" },
		{ key: "feature_desc", label: "Feature", type: "categorical" },
		{ key: "display_desc", label: "Display", type: "categorical" },
	],
};

export const useDatasetAnalytics = (datasetId?: string) => {
	const { showErrorToast } = useToast();

	const [selectedTable, setSelectedTable] = useState("transactions");
	const [selectedVariable, setSelectedVariable] = useState("week");
	const [variableStats, setVariableStats] = useState<VariableStats | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Get available variables for selected table
	const availableVariables = useMemo(
		() => VARIABLES_BY_TABLE[selectedTable] || [],
		[selectedTable]
	);

	// Get current variable info
	const selectedVariableInfo = useMemo(
		() => availableVariables.find((col) => col.key === selectedVariable),
		[availableVariables, selectedVariable]
	);

	const isNumerical = selectedVariableInfo?.type === "numerical";

	// Fetch variable statistics
	const fetchVariableStats = useCallback(
		async (table: string, variable: string) => {
			if (!datasetId || !table || !variable) return;

			setIsLoading(true);
			setError(null);

			try {
				const response = await datasetService.getVariableStatistics(
					datasetId,
					table,
					variable
				);

				if (response.success && response.data) {
					setVariableStats(response.data);
				} else {
					const errorMessage =
						response.error || "Failed to fetch variable statistics";
					setError(errorMessage);
					showErrorToast(errorMessage);
					setVariableStats(null);
				}
			} catch (err) {
				const errorMessage = "Failed to fetch variable statistics";
				setError(errorMessage);
				showErrorToast(errorMessage);
				setVariableStats(null);
			} finally {
				setIsLoading(false);
			}
		},
		[datasetId, showErrorToast]
	);

	// Process API data for display
	const processedStats = useMemo((): ProcessedStats | null => {
		if (!variableStats) return null;

		if (isNumerical) {
			const stats = variableStats as NumericalStats;
			return {
				type: "numerical",
				mean: stats.mean ?? 0,
				median: stats.median ?? 0,
				mode:
					stats.mode && Array.isArray(stats.mode) && stats.mode.length > 0
						? stats.mode[0]
						: "N/A",
				min: stats.min ?? 0,
				max: stats.max ?? 0,
				q1: stats.q1 ?? 0,
				q3: stats.q3 ?? 0,
				std: stats.std ?? 0,
				count: stats.count ?? 0,
				unique: stats.unique ?? 0,
				bins: stats.bins ?? {},
			} as ProcessedNumericalStats;
		} else {
			const stats = variableStats as CategoricalStats;
			const bins = stats.bins ?? {};
			const sortedBins = Object.entries(bins).sort(([, a], [, b]) => b - a);
			const mode = sortedBins[0]?.[0] || "N/A";

			// Process pie data - show top 10 and group rest as "Others"
			const sortedEntries = Object.entries(bins).sort(([, a], [, b]) => b - a);
			const top10 = sortedEntries.slice(0, 10);
			const remaining = sortedEntries.slice(10);

			let pieData = top10.map(([key, value]) => ({ name: key, value }));

			// Add "Others" category if there are more than 10 items
			if (remaining.length > 0) {
				const othersValue = remaining.reduce(
					(sum, [, value]) => sum + value,
					0
				);
				pieData.push({ name: "Others", value: othersValue });
			}

			return {
				type: "categorical",
				mode,
				frequency: bins,
				count: stats.count ?? 0,
				unique: stats.unique ?? 0,
				pieData,
			} as ProcessedCategoricalStats;
		}
	}, [variableStats, isNumerical]);

	// Prepare histogram data
	const histogramData = useMemo((): HistogramDataPoint[] => {
		if (!processedStats) return [];

		if (processedStats.type === "numerical") {
			// For numerical data, show top bins from API response
			return Object.entries(processedStats.bins)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 10) // Show top 10 bins
				.map(([value, count]) => ({ value: parseFloat(value), count }));
		} else {
			// For categorical data, show all categories
			return Object.entries(processedStats.frequency).map(
				([category, count]) => ({
					category,
					count,
				})
			);
		}
	}, [processedStats]);

	// Effect to reset variable when table changes
	useEffect(() => {
		const newVariables = VARIABLES_BY_TABLE[selectedTable];
		if (newVariables && newVariables.length > 0) {
			setSelectedVariable(newVariables[0].key);
		}
	}, [selectedTable]);

	// Effect to fetch data when selections change
	useEffect(() => {
		const availableVars = VARIABLES_BY_TABLE[selectedTable];
		const isValidVariable = availableVars?.some(
			(v) => v.key === selectedVariable
		);

		// Only fetch if the current variable is valid for the current table
		if (isValidVariable) {
			fetchVariableStats(selectedTable, selectedVariable);
		}
	}, [selectedTable, selectedVariable, fetchVariableStats]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const resetState = useCallback(() => {
		setVariableStats(null);
		setError(null);
		setSelectedTable("transactions");
		setSelectedVariable("week");
	}, []);

	return {
		// State
		selectedTable,
		selectedVariable,
		variableStats,
		processedStats,
		histogramData,
		isLoading,
		error,

		// Computed values
		availableVariables,
		selectedVariableInfo,
		isNumerical,

		// Actions
		setSelectedTable,
		setSelectedVariable,
		fetchVariableStats,

		// Utility methods
		clearError,
		resetState,

		// Constants
		childTables: CHILD_TABLES,
		variablesByTable: VARIABLES_BY_TABLE,
	};
};
