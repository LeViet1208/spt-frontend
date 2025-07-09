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
    if (dataset.status !== "completed") {
      setToastMessage("Please wait for the dataset to finish processing before accessing it.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    
    // Navigate to dataset detail page using search params
    router.push(`/datasets?id=${dataset.id}`);
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

    // Set up interval for refreshing datasets every 1 minute (60000 ms)
    const intervalId = setInterval(() => {
      refreshDatasets();
    }, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshDatasets]);

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Helper function to determine dataset status (remove progress)
  const getDatasetStatusAndProgress = (dataset: Dataset) => {
    let statusMessage: string;
    let isError = false;

    switch (dataset.status) {
      case "uploading":
        statusMessage = "Uploading";
        break;
      case "analyzing":
        statusMessage = "Analyzing";
        break;
      case "completed":
        statusMessage = "Ready";
        break;
      case "failed":
        statusMessage = "Error";
        isError = true;
        break;
      default:
        statusMessage = "Unknown";
    }

    return { statusMessage, isError };
  };

  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Render the main datasets list view
  return (
    <div className="space-y-6">
      {/* Conditional rendering of detail/add views */}
      {id && <DatasetDetailView params={{ id }} />}
      {view === 'add' && <DatasetAddView />}

      {/* Only render the main list if not in detail or add view */}
      {!id && view !== 'add' && (
        <>
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
                  <Button onClick={refreshDatasets} variant="destructive">
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
                  const { statusMessage, isError } = getDatasetStatusAndProgress(dataset);
                  return (
                    <Card 
                      key={dataset.id} 
                      className="hover:shadow-md cursor-pointer transition-shadow duration-200"
                      onClick={() => handleDatasetClick(dataset)}
                    >
                      <CardContent>
                        {/* Different layouts for list vs grid view */}
                        {viewMode === 'list' ? (
                          /* List View Layout */
                          <div className="flex flex-col">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                <Database className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-sm">
                                  <CardTitle className="text-base">{dataset.name}</CardTitle>
                                  <span className="text-muted-foreground">•</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(dataset.createdAt || '').toLocaleDateString()}</span>
                                  </div>
                                </div>
                                {dataset.description && (
                                  <CardDescription className="text-sm max-w-full line-clamp-1 mt-1">{dataset.description}</CardDescription>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {statusMessage}
                                </div>
                                {statusMessage === "Ready" ? (
                                  <CheckCircle className="h-4 w-4 text-chart-2" />
                                ) : dataset.status === "failed" ? (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Spinner 
                                    size="sm" 
                                    color={isError ? "destructive" : "chart-3"} 
                                    shimmer={dataset.status !== "completed" && !isError} 
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Grid View Layout */
                          <div className="flex items-center gap-6">
                            {/* Icon on the left */}
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              <Database className="h-8 w-8 text-muted-foreground" />
                            </div>
                            
                            {/* Vertical column of information */}
                            <div className="flex-1 flex flex-col gap-2">
                              {/* Name */}
                              <CardTitle className="text-base leading-tight">{dataset.name}</CardTitle>
                              
                              {/* Description */}
                              {dataset.description && (
                                <CardDescription className="text-sm line-clamp-2">{dataset.description}</CardDescription>
                              )}
                              
                              {/* Date */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(dataset.createdAt || '').toLocaleDateString()}</span>
                              </div>
                              
                              {/* Status */}
                              <div className="flex items-center gap-2">
                                {statusMessage === "Ready" ? (
                                  <CheckCircle className="h-4 w-4 text-chart-2" />
                                ) : dataset.status === "failed" ? (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Spinner 
                                    size="sm" 
                                    color={isError ? "destructive" : "chart-3"} 
                                    shimmer={dataset.status !== "completed" && !isError} 
                                  />
                                )}
                                <div className="text-xs font-medium text-muted-foreground">
                                  {statusMessage}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
        </>
      )}
    </div>
  )
}
