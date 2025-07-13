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
import { DatePicker } from "@/components/ui/DatePicker";
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
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DecompositionAnalysisRequest,
  DecompositionFilters,
  ComparisonScenario,
} from "@/utils/types/decomposition";
import { Campaign } from "@/utils/types/campaign";

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
    start_time: "",
    end_time: "",
    campaign_id: undefined,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { getDatasetValidationOptions } = useCampaign();
  const [storeOptions, setStoreOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [upcOptions, setUpcOptions] = useState<string[]>([]);

  // Search state for target parameters
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [upcSearchTerm, setUpcSearchTerm] = useState("");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUpcDropdown, setShowUpcDropdown] = useState(false);

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

  // Fetch stores when dataset changes
  useEffect(() => {
    if (selectedDatasetId) {
      const fetchStores = async () => {
        const response = await getDatasetValidationOptions(
          parseInt(selectedDatasetId, 10),
          { for_demand_decomposition: true }
        );
        if (response.success && response.data?.stores) {
          setStoreOptions(response.data.stores);
        }
      };
      fetchStores();
      updateFormField('store_id', 0);
      updateFormField('category', '');
      updateFormField('upc', '');
      setCategoryOptions([]);
      setUpcOptions([]);
      // Reset search terms and dropdown states
      setStoreSearchTerm("");
      setCategorySearchTerm("");
      setUpcSearchTerm("");
      setShowStoreDropdown(false);
      setShowCategoryDropdown(false);
      setShowUpcDropdown(false);
    }
  }, [selectedDatasetId, getDatasetValidationOptions]);

  // Fetch categories when store changes
  useEffect(() => {
    if (selectedDatasetId && formData.store_id) {
      const fetchCategories = async () => {
        const response = await getDatasetValidationOptions(
          parseInt(selectedDatasetId, 10),
          { for_demand_decomposition: true, store_id: formData.store_id.toString() }
        );
        if (response.success && response.data?.categories) {
          setCategoryOptions(response.data.categories);
        }
      };
      fetchCategories();
      updateFormField('category', '');
      updateFormField('upc', '');
      setUpcOptions([]);
      // Reset search terms and dropdown states
      setCategorySearchTerm("");
      setUpcSearchTerm("");
      setShowCategoryDropdown(false);
      setShowUpcDropdown(false);
    }
  }, [selectedDatasetId, formData.store_id, getDatasetValidationOptions]);

  // Fetch UPCs when category changes
  useEffect(() => {
    if (selectedDatasetId && formData.store_id && formData.category) {
      const fetchUpcs = async () => {
        const response = await getDatasetValidationOptions(
          parseInt(selectedDatasetId, 10),
          {
            for_demand_decomposition: true,
            store_id: formData.store_id.toString(),
            category: formData.category,
          }
        );
        if (response.success && response.data?.upcs) {
          setUpcOptions(response.data.upcs);
        }
      };
      fetchUpcs();
      updateFormField('upc', '');
      // Reset search terms and dropdown states
      setUpcSearchTerm("");
      setShowUpcDropdown(false);
    }
  }, [selectedDatasetId, formData.store_id, formData.category, getDatasetValidationOptions]);

  // Load history when dataset changes
  useEffect(() => {
    if (selectedDatasetId) {
      fetchHistory();
    }
  }, [selectedDatasetId, fetchHistory]);

  // Helper functions to get filtered options
  const getFilteredStoreOptions = () => {
    if (!storeSearchTerm) return storeOptions;
    return storeOptions.filter(store => 
      store.toLowerCase().includes(storeSearchTerm.toLowerCase())
    );
  };

  const getFilteredCategoryOptions = () => {
    if (!categorySearchTerm) return categoryOptions;
    return categoryOptions.filter(category => 
      category.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );
  };

  const getFilteredUpcOptions = () => {
    if (!upcSearchTerm) return upcOptions;
    return upcOptions.filter(upc => 
      upc.toLowerCase().includes(upcSearchTerm.toLowerCase())
    );
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!selectedDatasetId) errors.push("Dataset is required");
    if (!formData.campaign_id) errors.push("Campaign is required");
    if (!formData.upc || typeof formData.upc !== 'string' || !formData.upc.trim()) errors.push("UPC is required");
    if (!formData.store_id || formData.store_id <= 0) errors.push("Valid store ID is required");
    if (!formData.category || typeof formData.category !== 'string' || !formData.category.trim()) errors.push("Category is required");
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
    // Ensure string fields are properly converted to strings
    if (field === 'upc' || field === 'category') {
      value = String(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleDatasetChange = (newDatasetId: string) => {
    setSelectedDatasetId(newDatasetId);
    
    const campaignBelongsToDataset = allCampaigns?.some(
      (c: Campaign) =>
        c.campaign_id === formData.campaign_id &&
        c.dataset &&
        c.dataset.dataset_id.toString() === newDatasetId
    );

    if (formData.campaign_id && !campaignBelongsToDataset) {
      updateFormField('campaign_id', undefined);
    }
  };

  const handleCampaignChange = (value: string) => {
      // Don't allow "none" selection since campaign is now required
      if (value === "none") return;
      
      const campaignId = parseInt(value, 10);
      updateFormField('campaign_id', campaignId);

      if (campaignId) {
          const campaign = allCampaigns?.find((c: Campaign) => c.campaign_id === campaignId);
          if (campaign && campaign.dataset) {
              setSelectedDatasetId(campaign.dataset.dataset_id.toString());
          }
      }
  };

  // Handle target parameter selection
  const handleStoreSelect = (store: string) => {
    updateFormField('store_id', parseInt(store, 10));
    setStoreSearchTerm(store);
    setShowStoreDropdown(false);
  };

  const handleCategorySelect = (category: string) => {
    updateFormField('category', String(category));
    setCategorySearchTerm(String(category));
    setShowCategoryDropdown(false);
  };

  const handleUpcSelect = (upc: string) => {
    updateFormField('upc', String(upc));
    setUpcSearchTerm(String(upc));
    setShowUpcDropdown(false);
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
  const campaignsToShow: Campaign[] = (
    selectedDatasetId
      ? allCampaigns?.filter(
          (c: Campaign) =>
            c.dataset?.dataset_id?.toString() === selectedDatasetId
        )
      : allCampaigns
  ) || [];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Column: Visualization Area */}
      <div className="flex-1 mr-6 overflow-auto">
        <div className="h-full flex flex-col">
          {/* Main Visualization Area */}
          <div className="flex-1">
            {activeTab === "analysis" && (
              <>


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
                  <Card className="h-full">
                    <CardContent className="flex flex-col items-center justify-center h-full">
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
              </>
            )}

            {activeTab === "comparison" && (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Scenario Comparison
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Comparison results will be displayed here when scenarios are run
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === "history" && (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Analysis History
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Historical analysis results will be displayed here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Controls */}
      <div className="w-96 overflow-auto">
        <div className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Analysis Tab Content */}
          {activeTab === "analysis" && (
            <div className="space-y-4">
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
                  {/* Dataset and Campaign Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataset">Dataset *</Label>
                      <Select value={selectedDatasetId} onValueChange={handleDatasetChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select dataset" className="truncate" />
                        </SelectTrigger>
                        <SelectContent>
                          {datasets?.map((dataset) => (
                            <SelectItem 
                              key={dataset.id} 
                              value={dataset.id.toString()}
                              className="truncate"
                              title={dataset.name} // Native HTML tooltip
                            >
                              {dataset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaign">Campaign *</Label>
                      <Select
                        value={formData.campaign_id?.toString() || ""}
                        onValueChange={handleCampaignChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select campaign" className="truncate" />
                        </SelectTrigger>
                        <SelectContent>
                          {campaignsToShow.map((c: Campaign) => {
                            const fullText = !selectedDatasetId && c.dataset 
                              ? `${c.name} (${c.dataset.name})`
                              : c.name;
                            return (
                              <SelectItem
                                key={c.campaign_id}
                                value={c.campaign_id.toString()}
                                className="truncate"
                                title={fullText} // Native HTML tooltip
                              >
                                {fullText}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Target Parameters */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Target Parameters</h4>
                    
                    {/* Store ID */}
                    <div className="space-y-2">
                      <Label htmlFor="store_id">Store ID *</Label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Search stores..."
                              value={storeSearchTerm}
                              onChange={(e) => setStoreSearchTerm(e.target.value)}
                              onFocus={() => setShowStoreDropdown(true)}
                              className="pr-8"
                              disabled={!selectedDatasetId}
                            />
                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                            disabled={!selectedDatasetId}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Store Dropdown */}
                        {showStoreDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredStoreOptions().map((store) => (
                              <div
                                key={store}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleStoreSelect(store)}
                              >
                                {store}
                              </div>
                            ))}
                            {getFilteredStoreOptions().length === 0 && (
                              <div className="px-3 py-2 text-gray-500">
                                No stores available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Search categories..."
                              value={categorySearchTerm}
                              onChange={(e) => setCategorySearchTerm(e.target.value)}
                              onFocus={() => setShowCategoryDropdown(true)}
                              className="pr-8"
                              disabled={!formData.store_id}
                            />
                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            disabled={!formData.store_id}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Category Dropdown */}
                        {showCategoryDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredCategoryOptions().map((category) => (
                              <div
                                key={category}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleCategorySelect(category)}
                              >
                                {category}
                              </div>
                            ))}
                            {getFilteredCategoryOptions().length === 0 && (
                              <div className="px-3 py-2 text-gray-500">
                                No categories available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* UPC */}
                    <div className="space-y-2">
                      <Label htmlFor="upc">UPC *</Label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Search UPCs..."
                              value={upcSearchTerm}
                              onChange={(e) => setUpcSearchTerm(e.target.value)}
                              onFocus={() => setShowUpcDropdown(true)}
                              className="pr-8"
                              disabled={!formData.category}
                            />
                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUpcDropdown(!showUpcDropdown)}
                            disabled={!formData.category}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* UPC Dropdown */}
                        {showUpcDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredUpcOptions().map((upc) => (
                              <div
                                key={upc}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleUpcSelect(upc)}
                              >
                                {upc}
                              </div>
                            ))}
                            {getFilteredUpcOptions().length === 0 && (
                              <div className="px-3 py-2 text-gray-500">
                                No UPCs available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Time Period */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Time Period</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker
                        label="Start Time"
                        value={formData.start_time}
                        onChange={(value) => updateFormField('start_time', value)}
                        required
                      />

                      <DatePicker
                        label="End Time"
                        value={formData.end_time}
                        onChange={(value) => updateFormField('end_time', value)}
                        required
                      />
                    </div>
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
                      disabled={isLoading || !selectedDatasetId || !formData.campaign_id}
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
                      disabled={!selectedDatasetId || !formData.campaign_id}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comparison Tab Content */}
          {activeTab === "comparison" && (
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
                          UPC: {scenario.request.upc} | Store: {scenario.request.store_id}
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
          )}

          {/* History Tab Content */}
          {activeTab === "history" && (
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
          )}
        </div>
      </div>
    </div>
  );
}