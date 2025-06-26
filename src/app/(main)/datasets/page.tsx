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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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

  // Helper functions for rendering
  const getStatusBadge = (dataset: Dataset) => {
    if (dataset.importStatus === "import_completed") {
      return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Import Completed
      </Badge>
    } else {
      return <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
        <Upload className="h-3 w-3 mr-1 animate-pulse" />
        Importing...
      </Badge>
    }
  }

  const getAnalysisStatusBadge = (dataset: Dataset) => {
    if (dataset.importStatus !== "import_completed") return null
    
    if (dataset.analysisStatus === "analyzed") {
      return <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
        <BarChart className="h-3 w-3 mr-1" />
        Analyzed
      </Badge>
    } else if (dataset.analysisStatus === "analyzing") {
      return <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
        <Clock className="h-3 w-3 mr-1 animate-pulse" />
        Analyzing...
      </Badge>
    } else {
      return <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        Pending Analysis
      </Badge>
    }
  }

  const getFileStatusBadge = (dataset: any, fileType: string) => {
    let isUploaded = false
    
    switch (fileType) {
      case "transaction":
        isUploaded = ["importing_product_lookup", "importing_causal_lookup", "import_completed"].includes(dataset.importStatus)
        break
      case "product":
        isUploaded = ["importing_causal_lookup", "import_completed"].includes(dataset.importStatus)
        break
      case "causal":
        isUploaded = dataset.importStatus === "import_completed"
        break
    }

    const isCurrentlyUploading = dataset.importStatus === `importing_${fileType === "transaction" ? "transaction" : fileType === "product" ? "product_lookup" : "causal_lookup"}`

    if (isCurrentlyUploading) {
      return <Badge variant="secondary" className="bg-blue-50 text-blue-600">
        <Upload className="h-3 w-3 mr-1 animate-pulse" />
        Uploading
      </Badge>
    } else if (isUploaded) {
      return <Badge variant="secondary" className="bg-green-50 text-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Uploaded
      </Badge>
    } else {
      return <Badge variant="outline" className="text-gray-500">
        <XCircle className="h-3 w-3 mr-1" />
        Not Uploaded
      </Badge>
    }
  }

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

      {/* Dataset List */}
      <div className="space-y-4">
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
            {filteredAndSortedDatasets.map((dataset) => (
              <Card 
                key={dataset.id} 
                className="hover:shadow-md cursor-pointer transition-shadow duration-200"
                onClick={() => handleDatasetClick(dataset)}
              >
                <CardContent className="p-6">
                  {/* Main Dataset Information */}
                  <div className="flex items-start justify-between mb-4">
                    {/* Left side - Dataset info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Database className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{dataset.name}</CardTitle>
                        {dataset.description && (
                          <CardDescription className="mb-2 max-w-2xl">{dataset.description}</CardDescription>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Created {new Date(dataset.createdAt || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Status */}
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(dataset)}
                      {getAnalysisStatusBadge(dataset)}
                    </div>
                  </div>

                  {/* Dataset Files Section */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Dataset Files</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Transaction Data */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Transaction Data</span>
                        </div>
                        {getFileStatusBadge(dataset, "transaction")}
                      </div>

                      {/* Product Lookup */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Product Lookup</span>
                        </div>
                        {getFileStatusBadge(dataset, "product")}
                      </div>

                      {/* Causal Lookup */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Causal Lookup</span>
                        </div>
                        {getFileStatusBadge(dataset, "causal")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Dataset Empty Card */}
            {!debouncedSearchQuery.trim() && (
              <Card 
                className="hover:shadow-md cursor-pointer transition-shadow duration-200 border-dashed"
                onClick={handleAddDataset}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 hover:bg-muted/80 transition-colors">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg mb-2">Add New Dataset</CardTitle>
                      <CardDescription>Click here to upload and create a new dataset</CardDescription>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
