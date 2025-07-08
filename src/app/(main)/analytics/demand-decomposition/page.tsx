"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DateTimeInput } from "@/components/ui/datetime-input";
import { DecompositionChart } from "@/components/visualizations/DecompositionChart";
import { useDecompositionAnalytics } from "@/hooks/useDecompositionAnalytics";
import { useCampaign } from "@/hooks/useCampaign";
import { useDataset } from "@/hooks/useDataset";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import {
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  Clock,
  Filter,
  Settings,
  Plus,
  X,
  Eye,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DecompositionAnalysisRequest,
  DecompositionFilters,
  ComparisonScenario,
} from "@/utils/types/decomposition";

export default function DemandDecompositionPage() {
  const { userId } = useAuthStore();
  const { datasets, fetchDatasets } = useDataset();
  const { allCampaigns, fetchAllCampaigns } = useCampaign();

  // Form state
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [formData, setFormData] = useState<DecompositionAnalysisRequest>({
    upc: "",
    store_id: 0,
    category: "",
    brand: "",
    start_time: "",
    end_time: "",
    campaign_id: undefined,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Chart state
  const [chartType, setChartType] = useState<'bar' | 'waterfall' | 'pie' | 'heatmap'>('bar');
  
  // Active tab
  const [activeTab, setActiveTab] = useState('analysis');

  // Analytics hook
  const {
    analysisData,
    historyData,
    isLoading,
    error,
    pollingRequestId,
    comparisonScenarios,
    filters,
    sortOptions,
    analyzeDecomposition,
    fetchHistory,
    addComparisonScenario,
    removeComparisonScenario,
    runComparisonScenario,
    clearComparisonScenarios,
    setFilters,
    setSortOptions,
    getFilteredAndSortedResults,
    exportToCSV,
    clearError,
    resetState,
  } = useDecompositionAnalytics(selectedDatasetId);

  // Load initial data
  useEffect(() => {
    if (userId) {
      fetchDatasets();
      fetchAllCampaigns();
    }
  }, [userId, fetchDatasets, fetchAllCampaigns]);

  // Load history when dataset changes
  useEffect(() => {
    if (selectedDatasetId) {
      fetchHistory();
    }
  }, [selectedDatasetId, fetchHistory]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!selectedDatasetId) errors.push("Dataset is required");
    if (!formData.upc.trim()) errors.push("UPC is required");
    if (!formData.store_id || formData.store_id <= 0) errors.push("Valid store ID is required");
    if (!formData.category.trim()) errors.push("Category is required");
    if (!formData.brand.trim()) errors.push("Brand is required");
    if (!formData.start_time) errors.push("Start time is required");
    if (!formData.end_time) errors.push("End time is required");
    
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      if (start >= end) {
        errors.push("End time must be after start time");
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle form submission
  const handleAnalyze = async () => {
    if (!validateForm()) return;
    
    clearError();
    await analyzeDecomposition(formData);
  };

  // Handle form field changes
  const updateFormField = (field: keyof DecompositionAnalysisRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Handle comparison scenario
  const handleAddComparison = () => {
    if (!validateForm()) return;
    
    const scenarioName = `Scenario ${comparisonScenarios.length + 1}`;
    addComparisonScenario(scenarioName, { ...formData });
  };

  // Handle export
  const handleExport = () => {
    if (analysisData) {
      exportToCSV();
    }
  };

  // Get available campaigns for selected dataset
  const availableCampaigns = allCampaigns?.filter(
    (campaign: any) => campaign.dataset?.dataset_id?.toString() === selectedDatasetId
  ) || [];

  // Get filtered results for display
  const filteredResults = getFilteredAndSortedResults();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demand Change Decomposition</h1>
          <p className="text-muted-foreground">
            Analyze demand changes across 18 distinct decomposition categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pollingRequestId && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3 animate-pulse" />
              Processing...
            </Badge>
          )}
          {analysisData && (
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Analysis Parameters
                  </CardTitle>
                  <CardDescription>
                    Configure your demand decomposition analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dataset Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="dataset">Dataset *</Label>
                    <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {datasets?.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id.toString()}>
                            {dataset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campaign Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="campaign">Campaign (Optional)</Label>
                    <Select 
                      value={formData.campaign_id?.toString() || ""} 
                      onValueChange={(value) => updateFormField('campaign_id', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Campaign</SelectItem>
                        {availableCampaigns.map((campaign: any) => (
                          <SelectItem key={campaign.campaign_id} value={campaign.campaign_id.toString()}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Target Parameters */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Target Parameters</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="upc">UPC *</Label>
                      <Input
                        id="upc"
                        value={formData.upc}
                        onChange={(e) => updateFormField('upc', e.target.value)}
                        placeholder="Product UPC code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store_id">Store ID *</Label>
                      <Input
                        id="store_id"
                        type="number"
                        value={formData.store_id || ""}
                        onChange={(e) => updateFormField('store_id', parseInt(e.target.value) || 0)}
                        placeholder="Store identifier"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => updateFormField('category', e.target.value)}
                        placeholder="Product category"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand *</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => updateFormField('brand', e.target.value)}
                        placeholder="Product brand"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Time Period */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Time Period</h4>
                    
                    <DateTimeInput
                      label="Start Time *"
                      value={formData.start_time}
                      onChange={(value) => updateFormField('start_time', value)}
                      required
                    />

                    <DateTimeInput
                      label="End Time *"
                      value={formData.end_time}
                      onChange={(value) => updateFormField('end_time', value)}
                      required
                    />
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isLoading || !selectedDatasetId}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <BarChart3 className="h-4 w-4 mr-2" />
                      )}
                      Analyze
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddComparison}
                      disabled={!selectedDatasetId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              {analysisData ? (
                <DecompositionChart
                  data={analysisData.decomposition_analysis}
                  title="Demand Change Analysis"
                  description={`Analysis for ${analysisData.target_parameters.upc} in store ${analysisData.target_parameters.store_id}`}
                  chartType={chartType}
                  onChartTypeChange={setChartType}
                  onExport={handleExport}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No Analysis Yet
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Configure your parameters and run an analysis to see demand decomposition results
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Scenario Comparison
              </CardTitle>
              <CardDescription>
                Compare multiple analysis scenarios side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comparisonScenarios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No comparison scenarios added yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add scenarios from the Analysis tab to compare results
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comparisonScenarios.map((scenario) => (
                    <div key={scenario.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{scenario.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            scenario.status === 'completed' ? 'default' :
                            scenario.status === 'loading' ? 'secondary' :
                            scenario.status === 'error' ? 'destructive' : 'outline'
                          }>
                            {scenario.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runComparisonScenario(scenario.id)}
                            disabled={scenario.status === 'loading'}
                          >
                            {scenario.status === 'loading' ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <BarChart3 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeComparisonScenario(scenario.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        UPC: {scenario.request.upc} | Store: {scenario.request.store_id} | 
                        Brand: {scenario.request.brand}
                      </div>
                      {scenario.error && (
                        <div className="text-sm text-destructive mt-2">
                          Error: {scenario.error}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={clearComparisonScenarios}>
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Analysis History
              </CardTitle>
              <CardDescription>
                View previous decomposition analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyData?.requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No analysis history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData?.requests.map((request) => (
                    <div key={request.request_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">
                            {request.target_parameters.upc} - {request.target_parameters.brand}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Store {request.target_parameters.store_id} | {request.target_parameters.category}
                          </div>
                        </div>
                        <Badge variant={
                          request.status === 'completed' ? 'default' :
                          request.status === 'processing' ? 'secondary' : 'destructive'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                      {request.summary && (
                        <div className="mt-2 text-sm">
                          Total Change: {request.summary.total_change_percentage.toFixed(1)}% | 
                          Incremental Units: {request.summary.net_incremental_units.toFixed(0)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Configure how results are displayed and filtered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-4">
                <h4 className="font-medium">Filters</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Confidence Level</Label>
                    <Select 
                      value={filters.confidenceLevel || "all"} 
                      onValueChange={(value) => setFilters({ ...filters, confidenceLevel: value === "all" ? undefined : value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Change Type</Label>
                    <Select 
                      value={filters.changeType || "all"} 
                      onValueChange={(value) => setFilters({ ...filters, changeType: value === "all" ? undefined : value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Changes</SelectItem>
                        <SelectItem value="positive">Positive Only</SelectItem>
                        <SelectItem value="negative">Negative Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Change (%)</Label>
                  <Input
                    type="number"
                    value={filters.minimumChange || ""}
                    onChange={(e) => setFilters({ ...filters, minimumChange: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.0"
                    step="0.1"
                  />
                </div>
              </div>

              <Separator />

              {/* Sorting */}
              <div className="space-y-4">
                <h4 className="font-medium">Sorting</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select 
                      value={sortOptions.field} 
                      onValueChange={(value) => setSortOptions({ ...sortOptions, field: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Category Name</SelectItem>
                        <SelectItem value="percentage_change">Percentage Change</SelectItem>
                        <SelectItem value="absolute_change">Absolute Change</SelectItem>
                        <SelectItem value="confidence_level">Confidence Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select 
                      value={sortOptions.direction} 
                      onValueChange={(value) => setSortOptions({ ...sortOptions, direction: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}