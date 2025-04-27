"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUploader } from "@/components/file-uploader"
import { ImportHistory } from "@/components/tables/import-history"

export function ImportPage() {
  const [dataType, setDataType] = useState("sales")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Import Data</h2>
      </div>
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Data File</CardTitle>
              <CardDescription>Import your data by uploading a CSV or Excel file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Data Type</label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Data</SelectItem>
                    <SelectItem value="inventory">Inventory Data</SelectItem>
                    <SelectItem value="customers">Customer Data</SelectItem>
                    <SelectItem value="products">Product Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FileUploader dataType={dataType} />
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Process Data</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Data Format Guidelines</CardTitle>
              <CardDescription>Follow these guidelines to ensure your data is imported correctly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Sales Data Format</h3>
                  <p className="text-sm text-muted-foreground">
                    Required columns: Date, Order ID, Product ID, Quantity, Price, Customer ID
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Inventory Data Format</h3>
                  <p className="text-sm text-muted-foreground">
                    Required columns: Product ID, Quantity, Location, Last Updated
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Customer Data Format</h3>
                  <p className="text-sm text-muted-foreground">
                    Required columns: Customer ID, Name, Email, Phone, Address, Registration Date
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>View history of previous data imports</CardDescription>
            </CardHeader>
            <CardContent>
              <ImportHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
