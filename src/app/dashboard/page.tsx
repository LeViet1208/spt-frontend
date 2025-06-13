"use client"

import {
  Plus,
  CheckCircle,
  Upload,
  BarChart,
  Clock,
  RefreshCw,
  AlertCircle,
  Database,
  Megaphone,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  FileText,
  XCircle,
} from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDatasets } from "@/hooks/use-datasets"
import type { Campaign, PromotionRule } from "@/lib/api/campaign"
import { campaignAPI } from "@/lib/api/campaign"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'datasets'
  const router = useRouter()

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Campaign state
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [campaignLoading, setCampaignLoading] = useState(false)
  const [campaignError, setCampaignError] = useState<string | null>(null)
  const [promotionRules, setPromotionRules] = useState<{ [campaignId: number]: PromotionRule[] }>({})
  const [promotionRulesLoading, setPromotionRulesLoading] = useState<{ [campaignId: number]: boolean }>({})

  // Toast state
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // Use the datasets hook
  const { datasets, loading, error, refreshDatasets } = useDatasets()

  const handleAddDataset = () => {
    router.push("/dataset/add")
  }

  const handleRefresh = () => {
    if (activeTab === "datasets") {
      refreshDatasets()
    } else if (activeTab === "campaigns") {
      fetchAllCampaigns()
    }
  }

  const handleVisualizeCampaign = (campaignId: number) => {
    console.log("Visualize campaign:", campaignId)
    // TODO: Implement campaign visualization
  }

  const fetchAllCampaigns = async () => {
    try {
      setCampaignLoading(true)
      setCampaignError(null)

      const response = await campaignAPI.getAllCampaigns()

      if (response.success && response.data) {
        setAllCampaigns(response.data)
        
        // Fetch promotion rules for each campaign
        for (const campaign of response.data) {
          fetchPromotionRules(campaign.campaign_id)
        }
      } else {
        setCampaignError(response.error || "Failed to fetch campaigns")
      }
    } catch (err) {
      setCampaignError("An unexpected error occurred")
      console.error("Error fetching campaigns:", err)
    } finally {
      setCampaignLoading(false)
    }
  }

  const fetchPromotionRules = async (campaignId: number) => {
    try {
      setPromotionRulesLoading(prev => ({ ...prev, [campaignId]: true }))
      
      const response = await campaignAPI.getPromotionRules(campaignId)
      
      if (response.success && response.data) {
        setPromotionRules(prev => ({ ...prev, [campaignId]: response.data! }))
      }
    } catch (err) {
      console.error("Error fetching promotion rules:", err)
    } finally {
      setPromotionRulesLoading(prev => ({ ...prev, [campaignId]: false }))
    }
  }

  // Debounce search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Fetch campaigns when campaign tab is selected
  useEffect(() => {
    if (activeTab === "campaigns") {
      fetchAllCampaigns()
    }
  }, [activeTab])

  // Filter and sort datasets
  const filteredAndSortedDatasets = useMemo(() => {
    let filtered = datasets

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = datasets.filter(dataset => 
        dataset.name.toLowerCase().includes(query) ||
        (dataset.description && dataset.description.toLowerCase().includes(query))
      )
    }

    // Apply sorting by date created
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [datasets, debouncedSearchQuery, sortOrder])

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = allCampaigns

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = allCampaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(query) ||
        (campaign.description && campaign.description.toLowerCase().includes(query))
      )
    }

    // Apply sorting by date created
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [allCampaigns, debouncedSearchQuery, sortOrder])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle sort order toggle
  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  const getStatusColor = (isActive: boolean) => {
    if (isActive) {
      return "bg-green-100 text-green-800"
    }
    return "bg-gray-100 text-gray-800"
  }

  const getCampaignIcon = () => {
    return "🏷️"
  }

  const formatRuleType = (ruleType: string) => {
    switch (ruleType) {
      case "price_reduction":
        return "Price Reduction"
      default:
        return ruleType
    }
  }

  const formatTargetType = (targetType: string) => {
    switch (targetType) {
      case "category":
        return "Category"
      case "brand":
        return "Brand"
      case "upc":
        return "UPC"
      default:
        return targetType
    }
  }

  const formatDateRange = (startDate: number, endDate: number) => {
    const start = new Date(startDate * 1000).toLocaleDateString()
    const end = new Date(endDate * 1000).toLocaleDateString()
    return `${start} - ${end}`
  }

  const handleAddCampaign = () => {
    router.push("/campaign/new")
  }

  // Handle dataset click
  const handleDatasetClick = (dataset: any) => {
    if (dataset.importStatus !== "import_completed") {
      setToastMessage("Please wait for the dataset to finish uploading before accessing it.")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      return
    }
    
    // Navigate to dataset detail page if import is completed
    router.push(`/dataset/${dataset.id}`)
  }

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  return (
    <>
      {activeTab === "datasets" && (
        <>
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search datasets by name or description..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-colors"
                />
              </div>
              
              {/* Sort Button */}
              <button
                onClick={handleSortToggle}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                title={`Sort by date created (${sortOrder === 'desc' ? 'newest first' : 'oldest first'})`}
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="h-4 w-4 text-gray-600" />
                ) : (
                  <SortAsc className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm text-gray-600">
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                title="Refresh datasets"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="text-sm text-gray-600">Refresh</span>
              </button>

              {/* Add Dataset Button */}
              <button
                onClick={handleAddDataset}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors shadow-sm hover:shadow-md cursor-pointer"
                title="Add Dataset"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm text-white">Add Dataset</span>
              </button>
            </div>
            
            {/* Search Results Count */}
            {debouncedSearchQuery.trim() && (
              <div className="mt-2 text-sm text-gray-500">
                {filteredAndSortedDatasets.length} dataset{filteredAndSortedDatasets.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Dataset List */}
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
                  <p className="text-gray-500">Loading datasets...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="text-lg font-medium mb-2">Error loading datasets</p>
                  <p className="text-sm mb-4">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredAndSortedDatasets.length === 0 && debouncedSearchQuery.trim() ? (
                <div className="p-8 text-center text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No datasets match your search</p>
                  <p className="text-sm mb-4">Try adjusting your search terms</p>
                </div>
              ) : (
                <>
                  {filteredAndSortedDatasets.map((dataset) => (
                    <div 
                      key={dataset.id} 
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      onClick={() => handleDatasetClick(dataset)}
                    >
                      {/* Main Dataset Information */}
                      <div className="flex items-start justify-between mb-4">
                        {/* Left side - Dataset info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Database className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{dataset.name}</h3>
                            {dataset.description && (
                              <p className="text-sm text-gray-600 mb-2 max-w-2xl">{dataset.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>Created {new Date(dataset.createdAt || '').toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Status */}
                        <div className="flex flex-col items-end gap-2">
                          {dataset.importStatus === "import_completed" ? (
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-md">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Import Completed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
                              <Upload className="h-4 w-4 animate-pulse" />
                              <span className="text-sm font-medium">Importing...</span>
                            </div>
                          )}

                          {dataset.importStatus === "import_completed" && (
                            <>
                              {dataset.analysisStatus === "analyzed" ? (
                                <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-md">
                                  <BarChart className="h-4 w-4" />
                                  <span className="text-sm font-medium">Analyzed</span>
                                </div>
                              ) : dataset.analysisStatus === "analyzing" ? (
                                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-md">
                                  <Clock className="h-4 w-4 animate-pulse" />
                                  <span className="text-sm font-medium">Analyzing...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-gray-50 text-gray-700 px-3 py-1 rounded-md">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm font-medium">Pending Analysis</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Child Datasets Section */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Dataset Files</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Transaction Data */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-900">Transaction Data</span>
                            </div>
                            {dataset.importStatus === "importing_transaction" ? (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Upload className="h-3 w-3 animate-pulse" />
                                <span className="text-xs">Uploading</span>
                              </div>
                            ) : dataset.importStatus === "import_completed" || 
                                   dataset.importStatus === "importing_product_lookup" || 
                                   dataset.importStatus === "importing_causal_lookup" ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span className="text-xs">Uploaded</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-500">
                                <XCircle className="h-3 w-3" />
                                <span className="text-xs">Not Uploaded</span>
                              </div>
                            )}
                          </div>

                          {/* Product Lookup */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-900">Product Lookup</span>
                            </div>
                            {dataset.importStatus === "importing_product_lookup" ? (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Upload className="h-3 w-3 animate-pulse" />
                                <span className="text-xs">Uploading</span>
                              </div>
                            ) : dataset.importStatus === "import_completed" || 
                                   dataset.importStatus === "importing_causal_lookup" ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span className="text-xs">Uploaded</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-500">
                                <XCircle className="h-3 w-3" />
                                <span className="text-xs">Not Uploaded</span>
                              </div>
                            )}
                          </div>

                          {/* Causal Lookup */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-900">Causal Lookup</span>
                            </div>
                            {dataset.importStatus === "importing_causal_lookup" ? (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Upload className="h-3 w-3 animate-pulse" />
                                <span className="text-xs">Uploading</span>
                              </div>
                            ) : dataset.importStatus === "import_completed" ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span className="text-xs">Uploaded</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-500">
                                <XCircle className="h-3 w-3" />
                                <span className="text-xs">Not Uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Dataset Empty Card */}
                  {!debouncedSearchQuery.trim() && (
                    <div 
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200 border-t border-gray-200"
                      onClick={handleAddDataset}
                    >
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 hover:bg-gray-200 transition-colors">
                            <Plus className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Dataset</h3>
                          <p className="text-sm text-gray-500">Click here to upload and create a new dataset</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show empty state only when no datasets exist */}
                  {filteredAndSortedDatasets.length === 0 && !debouncedSearchQuery.trim() && (
                    <div className="p-8 text-center text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No datasets found</p>
                      <p className="text-sm mb-4">Get started by adding your first dataset</p>
                      <button
                        onClick={handleAddDataset}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Add Dataset
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "campaigns" && (
        <>
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search campaigns by name or description..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-colors"
                />
              </div>
              
              {/* Sort Button */}
              <button
                onClick={handleSortToggle}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                title={`Sort by date created (${sortOrder === 'desc' ? 'newest first' : 'oldest first'})`}
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="h-4 w-4 text-gray-600" />
                ) : (
                  <SortAsc className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm text-gray-600">
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={campaignLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                title="Refresh campaigns"
              >
                <RefreshCw className={`h-4 w-4 ${campaignLoading ? "animate-spin" : ""}`} />
                <span className="text-sm text-gray-600">Refresh</span>
              </button>

              {/* Add Campaign Button */}
              <button
                onClick={handleAddCampaign}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors shadow-sm hover:shadow-md cursor-pointer"
                title="Add Campaign"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm text-white">Add Campaign</span>
              </button>
            </div>
            
            {/* Search Results Count */}
            {debouncedSearchQuery.trim() && (
              <div className="mt-2 text-sm text-gray-500">
                {filteredAndSortedCampaigns.length} campaign{filteredAndSortedCampaigns.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Campaign List */}
            <div className="divide-y divide-gray-200">
              {campaignLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
                  <p className="text-gray-500">Loading campaigns...</p>
                </div>
              ) : campaignError ? (
                <div className="p-8 text-center text-red-600">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="text-lg font-medium mb-2">Error loading campaigns</p>
                  <p className="text-sm mb-4">{campaignError}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredAndSortedCampaigns.length === 0 && debouncedSearchQuery.trim() ? (
                <div className="p-8 text-center text-gray-500">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No campaigns match your search</p>
                  <p className="text-sm mb-4">Try adjusting your search terms</p>
                </div>
              ) : (
                <>
                  {filteredAndSortedCampaigns.map((campaign) => (
                    <div 
                      key={campaign.campaign_id} 
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      onClick={() => router.push(`/campaign/${campaign.campaign_id}`)}
                    >
                      {/* Main Campaign Information */}
                      <div className="flex items-start justify-between mb-4">
                        {/* Left side - Campaign info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Megaphone className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                            {campaign.description && (
                              <p className="text-sm text-gray-600 mb-2 max-w-2xl">{campaign.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Created {new Date(campaign.created_at || '').toLocaleDateString()}</span>
                              </div>
                              {campaign.dataset && (
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4" />
                                  <span>Dataset: {campaign.dataset.name || `ID ${campaign.dataset.dataset_id}`}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side - Campaign Status */}
                        <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-md ${getStatusColor(campaign.is_active)}`}>
                            <span className="text-sm font-medium">
                              {campaign.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
                            <span className="text-sm font-medium">
                              {campaign.promotion_rules_count} promotion rule{campaign.promotion_rules_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Promotion Rules Section */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Promotion Rules</h4>
                        
                        {promotionRulesLoading[campaign.campaign_id] ? (
                          <div className="flex items-center justify-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500">Loading promotion rules...</span>
                          </div>
                        ) : !promotionRules[campaign.campaign_id] || promotionRules[campaign.campaign_id].length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No promotion rules found</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {promotionRules[campaign.campaign_id].map((rule) => (
                              <div key={rule.promotion_rule_id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h5 className="text-sm font-medium text-gray-900">{rule.name}</h5>
                                      <span className={`px-2 py-1 text-xs rounded-md ${getStatusColor(rule.is_active)}`}>
                                        {rule.is_active ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Type:</span>
                                        <span>{formatRuleType(rule.rule_type)}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Target:</span>
                                        <span>{formatTargetType(rule.target_type)}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Duration:</span>
                                        <span>{formatDateRange(rule.start_date, rule.end_date)}</span>
                                      </div>
                                    </div>

                                    {/* Rule Details */}
                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                                      {rule.price_reduction_percentage && (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                          -{rule.price_reduction_percentage}% off
                                        </span>
                                      )}
                                      {rule.price_reduction_amount && (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                          -${rule.price_reduction_amount} off
                                        </span>
                                      )}
                                      {rule.feature_enabled && (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                          Featured
                                        </span>
                                      )}
                                      {rule.display_enabled && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                          Display
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Campaign Empty Card */}
                  {!debouncedSearchQuery.trim() && (
                    <div 
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200 border-t border-gray-200"
                      onClick={handleAddCampaign}
                    >
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 hover:bg-gray-200 transition-colors">
                            <Plus className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Campaign</h3>
                          <p className="text-sm text-gray-500">Click here to create a new campaign</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show empty state only when no campaigns exist */}
                  {filteredAndSortedCampaigns.length === 0 && !debouncedSearchQuery.trim() && (
                    <div className="p-8 text-center text-gray-500">
                      <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No campaigns found</p>
                      <p className="text-sm mb-4">Get started by creating your first campaign</p>
                      <button
                        onClick={handleAddCampaign}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Add Campaign
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "setting" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
          <p className="text-gray-600">Configure your account and application settings.</p>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Dataset Not Ready</p>
                <p className="text-sm text-amber-700 mt-1">{toastMessage}</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="text-amber-600 hover:text-amber-800 transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
