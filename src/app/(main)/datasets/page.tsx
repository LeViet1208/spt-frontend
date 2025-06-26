"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useDataset } from '@/hooks/useDataset'
import type { Dataset } from '@/utils/types/dataset'
import {
  Plus,
  CheckCircle,
  Upload,
  BarChart,
  Clock,
  RefreshCw,
  AlertCircle,
  Database,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  FileText,
  XCircle,
  ArrowLeft,
  List, // Added for list view icon
  Grid, // Added for grid view icon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress" // Re-added Progress import
import { Spinner } from "@/components/ui/spinner" // Added Spinner import
import { DatasetsListSkeleton, DatasetDetailSkeleton, AddDatasetSkeleton } from "@/components/DatasetSkeletons"

// Dynamically import components to avoid SSR issues
const DatasetDetailView = dynamic(() => import('./[id]/page'), { 
  ssr: false,
  loading: () => <DatasetDetailSkeleton />
})

const DatasetAddView = dynamic(() => import('./add/page'), { 
  ssr: false,
  loading: () => <AddDatasetSkeleton />
})

export default function DatasetsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const view = searchParams.get('view')
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Toast state
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // Loading state for initial render - tracks if we've ever loaded data
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Use the datasets hook
  const { datasets, isLoading: loading, error, fetchDatasets: refreshDatasets } = useDataset()

  // Handle navigation
  const handleAddDataset = () => {
    router.push("/datasets?view=add")
  }

  const handleBack = () => {
    router.push("/datasets")
  }

  const handleRefresh = () => {
    refreshDatasets()
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle sort order toggle
  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  // Handle dataset click
  const handleDatasetClick = (dataset: Dataset) => {
    if (dataset.importStatus !== "import_completed") {
      setToastMessage("Please wait for the dataset to finish uploading before accessing it.")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      return
    }
    
    // Navigate to dataset detail page using search params
    router.push(`/datasets?id=${dataset.id}`)
  }

  // Fetch datasets on mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        await refreshDatasets()
      } finally {
        setHasLoadedOnce(true)
      }
    }
    loadDatasets()
  }, [])

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // If we have an ID, show the detail view
  if (id) {
    return <DatasetDetailView params={{ id }} />
  }

  // If view is add, show the add form
  if (view === 'add') {
    return <DatasetAddView />
  }

  // Helper function to determine dataset status and progress
  const getDatasetStatusAndProgress = (dataset: Dataset) => {
    let statusMessage: string
    let progressValue: number
    let isError = false;

    if (dataset.importStatus === "import_failed" || dataset.analysisStatus === "analysis_failed") {
      statusMessage = "Error";
      progressValue = 100; // Show full bar in red for error
      isError = true;
    } else if (dataset.importStatus === "importing_transaction") {
      statusMessage = "Uploading Transactions";
      progressValue = 25;
    } else if (dataset.importStatus === "importing_product_lookup") {
      statusMessage = "Uploading Products";
      progressValue = 50;
    } else if (dataset.importStatus === "importing_causal_lookup") {
      statusMessage = "Uploading Causal Data";
      progressValue = 75;
    } else if (dataset.importStatus === "import_completed" && dataset.analysisStatus === "not_started") {
      statusMessage = "Pending Analysis";
      progressValue = 90;
    } else if (dataset.analysisStatus === "analyzing") {
      statusMessage = "Analyzing";
      progressValue = 95;
    } else if (dataset.analysisStatus === "analyzed") {
      statusMessage = "Analyzed";
      progressValue = 100;
    } else {
      statusMessage = "Unknown Status";
      progressValue = 0;
    }

    return { statusMessage, progressValue, isError };
  };

  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Render the main datasets list view
  return (
    <div className="space-y-6">

      {/* Search and Filter Bar */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search datasets by name or description..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            
            {/* Sort Button */}
            <Button
              variant="outline"
              onClick={handleSortToggle}
              className="flex items-center gap-2"
            >
              {sortOrder === 'desc' ? (
                <SortDesc className="h-4 w-4" />
              ) : (
                <SortAsc className="h-4 w-4" />
              )}
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {/* Add Dataset Button */}
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                aria-label="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Add Dataset Button */}
            <Button onClick={handleAddDataset} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Dataset
            </Button>
          </div>
          
          {/* Search Results Count */}
          {debouncedSearchQuery.trim() && (
            <div className="mt-2 text-sm text-muted-foreground">
              {filteredAndSortedDatasets.length} dataset{filteredAndSortedDatasets.length !== 1 ? 's' : ''} found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dataset List/Grid */}
      <div className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
        {(!hasLoadedOnce || loading) ? (
          <DatasetsListSkeleton />
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <CardTitle className="text-lg mb-2 text-destructive">Error loading datasets</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={handleRefresh} variant="destructive">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedDatasets.length === 0 && debouncedSearchQuery.trim() ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="text-lg mb-2">No datasets match your search</CardTitle>
              <CardDescription>Try adjusting your search terms</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredAndSortedDatasets.map((dataset) => {
              const { statusMessage, progressValue, isError } = getDatasetStatusAndProgress(dataset);
              return (
                <Card 
                  key={dataset.id} 
                  className="hover:shadow-md cursor-pointer transition-shadow duration-200"
                  onClick={() => handleDatasetClick(dataset)}
                >
                  <CardContent>
                    {/* Main Dataset Information */}
                    <div className="flex flex-col">
                      {/* Row 1: Name, Date Created, Description */}
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Database className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-sm">
                            <CardTitle className="text-base">{dataset.name}</CardTitle>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(dataset.createdAt || '').toLocaleDateString()}</span>
                            </div>
                          </div>
                          {dataset.description && (
                            <CardDescription className="text-sm max-w-full line-clamp-1 mt-1">{dataset.description}</CardDescription>
                          )}
                        </div>
                        {viewMode === 'list' && (
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-medium text-muted-foreground">
                              {statusMessage}
                            </div>
                            {progressValue === 100 && !isError ? (
                              <CheckCircle className="h-4 w-4 text-chart-2" />
                            ) : (
                              <Spinner 
                                size="sm" 
                                color={isError ? "destructive" : "chart-3"} 
                                shimmer={progressValue < 100 && !isError} 
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Row 2: Progress Bar (only for grid view) */}
                      {viewMode === 'grid' && (
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-muted-foreground text-center my-2">
                            {statusMessage}
                          </div>
                          <Progress
                            value={progressValue}
                            className={`h-2 ${isError ? 'bg-red-500' : ''}`}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Show empty state only when no datasets exist */}
            {filteredAndSortedDatasets.length === 0 && !debouncedSearchQuery.trim() && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="text-lg mb-2">No datasets found</CardTitle>
                  <CardDescription className="mb-4">Get started by adding your first dataset</CardDescription>
                  <Button onClick={handleAddDataset}>
                    Add Dataset
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="max-w-sm border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium text-amber-800">Dataset Not Ready</CardTitle>
                  <CardDescription className="text-sm text-amber-700 mt-1">{toastMessage}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowToast(false)}
                  className="text-amber-600 hover:text-amber-800 h-auto p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
