import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Skeleton for the main datasets list page
export function DatasetsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar Skeleton */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Search Input Skeleton */}
            <div className="flex-1 relative">
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Sort Button Skeleton */}
            <Skeleton className="h-10 w-20" />

            {/* Refresh Button Skeleton */}
            <Skeleton className="h-10 w-20" />

            {/* Add Dataset Button Skeleton */}
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Dataset Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              {/* Main Dataset Information */}
              <div className="flex items-start justify-between mb-4">
                {/* Left side - Dataset info */}
                <div className="flex items-start gap-4 flex-1">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>

                {/* Right side - Status */}
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>

              {/* Dataset Files Section */}
              <div className="pt-4 border-t">
                <Skeleton className="h-5 w-24 mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, fileIndex) => (
                    <div key={fileIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Skeleton for dataset detail view
export function DatasetDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variable Selection Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Descriptive Statistics Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart/Summary Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[300px] rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Histogram Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px] rounded" />
        </CardContent>
      </Card>

      {/* Box Plot Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px] rounded mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton for add dataset page
export function AddDatasetSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Skeleton */}
      <Card>
        <CardContent className="p-8">
          {/* Step Indicator Skeleton */}
          <div className="flex items-center justify-between mb-8 px-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            ))}
          </div>

          {/* Step Content Skeleton */}
          <div className="mb-8 space-y-6">
            {/* Title */}
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>

            {/* Required Columns Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[...Array(5)].map((_, badgeIndex) => (
                    <Skeleton key={badgeIndex} className="h-6 w-20" />
                  ))}
                </div>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>

            {/* Upload Area Skeleton */}
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardContent className="p-8 text-center">
                <Skeleton className="h-12 w-12 mx-auto mb-4" />
                <Skeleton className="h-6 w-40 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto mb-4" />
                <Skeleton className="h-10 w-32 mx-auto" />
              </CardContent>
            </Card>

            {/* Supported Formats */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Navigation Buttons Skeleton */}
          <div className="flex justify-between">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton for final step of add dataset
export function AddDatasetFinalStepSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Skeleton */}
      <Card>
        <CardContent className="p-8">
          {/* Step Indicator Skeleton */}
          <div className="flex items-center justify-between mb-8 px-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            ))}
          </div>

          {/* Finalize Content */}
          <div className="mb-8 space-y-6">
            <Skeleton className="h-7 w-40 mb-6" />

            {/* Dataset Details Form */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>

            {/* Files Summary */}
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Buttons Skeleton */}
          <div className="flex justify-between">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
