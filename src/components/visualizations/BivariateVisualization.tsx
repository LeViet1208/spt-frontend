"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw, BarChart3, AlertCircle } from "lucide-react";
import { useBivariateVisualization } from "@/hooks/useBivariateVisualization";
import { CHILD_TABLES, VARIABLES_BY_TABLE } from "@/hooks/useDatasetAnalytics";
import { BivariateVisualizationRequest } from "@/utils/types/dataset";
import dynamic from "next/dynamic";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface BivariateVisualizationProps {
	datasetId: string;
}

export const BivariateVisualization: React.FC<BivariateVisualizationProps> = ({
	datasetId,
}) => {
	const {
		visualizationData,
		isLoading,
		error,
		fetchBivariateVisualization,
		clearError,
	} = useBivariateVisualization(datasetId);

	const [table1, setTable1] = useState("transactions");
	const [variable1, setVariable1] = useState("");
	const [table2, setTable2] = useState("transactions");
	const [variable2, setVariable2] = useState("");

	// Set default variables when tables change - FIXED with proper null checks
	useEffect(() => {
		const table1Variables = VARIABLES_BY_TABLE[table1] || [];
		if (table1Variables.length > 0 && !variable1) {
			setVariable1(table1Variables[0].key);
		}
	}, [table1, variable1]);

	useEffect(() => {
		const table2Variables = VARIABLES_BY_TABLE[table2] || [];
		if (table2Variables.length > 0 && !variable2) {
			setVariable2(table2Variables[0].key);
		}
	}, [table2, variable2]);

	const handleGenerateVisualization = () => {
		if (!variable1 || !variable2) return;

		const request: BivariateVisualizationRequest = {
			table1,
			variable1,
			table2,
			variable2,
		};

		fetchBivariateVisualization(request);
	};

	const canGenerate = variable1 && variable2 && (table1 !== table2 || variable1 !== variable2);

	// Prepare plot data based on chart type - FIXED with proper null checks
	const getPlotData = (): any[] => {
		if (!visualizationData?.data) return [];

		const { data, chart_type, variable1_info, variable2_info } = visualizationData;

		switch (chart_type) {
			case "scatter":
				return [
					{
						x: data.map(d => d.x),
						y: data.map(d => d.y),
						mode: "markers",
						type: "scatter",
						name: `${variable1_info?.name || 'Variable 1'} vs ${variable2_info?.name || 'Variable 2'}`,
						marker: {
							size: 8,
							opacity: 0.6,
						},
					},
				];

			case "heatmap":
				// For heatmap, we need to reshape the data
				const uniqueX = Array.from(new Set(data.map(d => d.x)));
				const uniqueY = Array.from(new Set(data.map(d => d.y)));
				const zValues = uniqueY.map(y =>
					uniqueX.map(x => {
						const point = data.find(d => d.x === x && d.y === y);
						return point ? point.count || 1 : 0;
					})
				);

				return [
					{
						x: uniqueX,
						y: uniqueY,
						z: zValues,
						type: "heatmap",
						colorscale: "Viridis",
					},
				];

			case "bar":
				return [
					{
						x: data.map(d => d.x),
						y: data.map(d => d.count || d.y),
						type: "bar",
						name: `${variable1_info?.name || 'Variable 1'} Distribution`,
					},
				];

			default:
				return [
					{
						x: data.map(d => d.x),
						y: data.map(d => d.y),
						mode: "markers",
						type: "scatter",
						name: `${variable1_info?.name || 'Variable 1'} vs ${variable2_info?.name || 'Variable 2'}`,
					},
				];
		}
	};

	const getPlotLayout = (): any => {
		if (!visualizationData) return {};

		const { variable1_info, variable2_info, correlation } = visualizationData;

		return {
			title: {
				text: `${variable1_info?.name || 'Variable 1'} vs ${variable2_info?.name || 'Variable 2'}${correlation !== undefined ? ` (r = ${correlation.toFixed(3)})` : ""
					}`,
			},
			xaxis: {
				title: {
					text: `${variable1_info?.name || 'Variable 1'} (${variable1_info?.table || 'Unknown'})`,
				},
			},
			yaxis: {
				title: {
					text: `${variable2_info?.name || 'Variable 2'} (${variable2_info?.table || 'Unknown'})`,
				},
			},
			height: 500,
			margin: { t: 50, r: 50, b: 50, l: 50 },
		};
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5" />
					Bivariate Visualization
				</CardTitle>
				<CardDescription>
					Analyze relationships between two variables across different datasets
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Variable Selection */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Variable 1 */}
					<div className="space-y-4">
						<h4 className="font-medium">Variable 1</h4>
						<div className="space-y-2">
							<Label htmlFor="table1">Table</Label>
							<Select value={table1} onValueChange={setTable1}>
								<SelectTrigger>
									<SelectValue placeholder="Select table" />
								</SelectTrigger>
								<SelectContent>
									{CHILD_TABLES.map((table) => (
										<SelectItem key={table.key} value={table.key}>
											{table.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="variable1">Variable</Label>
							<Select value={variable1} onValueChange={setVariable1}>
								<SelectTrigger>
									<SelectValue placeholder="Select variable" />
								</SelectTrigger>
								<SelectContent>
									{VARIABLES_BY_TABLE[table1]?.map((variable) => (
										<SelectItem key={variable.key} value={variable.key}>
											{variable.label} ({variable.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Variable 2 */}
					<div className="space-y-4">
						<h4 className="font-medium">Variable 2</h4>
						<div className="space-y-2">
							<Label htmlFor="table2">Table</Label>
							<Select value={table2} onValueChange={setTable2}>
								<SelectTrigger>
									<SelectValue placeholder="Select table" />
								</SelectTrigger>
								<SelectContent>
									{CHILD_TABLES.map((table) => (
										<SelectItem key={table.key} value={table.key}>
											{table.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="variable2">Variable</Label>
							<Select value={variable2} onValueChange={setVariable2}>
								<SelectTrigger>
									<SelectValue placeholder="Select variable" />
								</SelectTrigger>
								<SelectContent>
									{VARIABLES_BY_TABLE[table2]?.map((variable) => (
										<SelectItem key={variable.key} value={variable.key}>
											{variable.label} ({variable.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Generate Button */}
				<div className="flex justify-center">
					<Button
						onClick={handleGenerateVisualization}
						disabled={!canGenerate || isLoading}
						className="flex justify-center w-full md:w-auto"
					>
						{isLoading ? (
							<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<BarChart3 className="h-4 w-4 mr-2" />
						)}
						Generate Visualization
					</Button>
				</div>

				{/* Error Display */}
				{error && (
					<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
						<div className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-4 w-4" />
							<span className="font-medium">Error</span>
						</div>
						<p className="mt-1 text-sm text-destructive">{error}</p>
						<Button
							variant="outline"
							size="sm"
							onClick={clearError}
							className="mt-2"
						>
							Dismiss
						</Button>
					</div>
				)}

				{/* Visualization Display - FIXED with proper null checks */}
				{visualizationData && (
					<div className="space-y-4">
						<div className="p-4 bg-muted rounded-lg">
							<h4 className="font-medium mb-2">Visualization Details</h4>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div>
									<span className="font-medium">Chart Type:</span>{" "}
									{visualizationData.chart_type}
								</div>
								<div>
									<span className="font-medium">Data Points:</span>{" "}
									{visualizationData.data?.length || 0}
								</div>
								{visualizationData.correlation !== undefined && (
									<div>
										<span className="font-medium">Correlation:</span>{" "}
										{visualizationData.correlation.toFixed(3)}
									</div>
								)}
							</div>
						</div>

						<div className="w-full overflow-hidden rounded-lg border">
							<Plot
								data={getPlotData()}
								layout={getPlotLayout()}
								config={{
									responsive: true,
									displayModeBar: true,
									displaylogo: false,
									modeBarButtonsToRemove: ["pan2d", "lasso2d"],
								}}
								style={{ width: "100%" }}
							/>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};