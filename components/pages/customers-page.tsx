"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerChart } from "@/components/charts/customer-chart"
import { CustomerTable } from "@/components/tables/customer-table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Customer Analytics</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search customers..." className="w-[250px] pl-8" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24,780</div>
            <p className="text-xs text-muted-foreground">+12.4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,429</div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Purchase Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42.8%</div>
            <p className="text-xs text-muted-foreground">+3.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$320.50</div>
            <p className="text-xs text-muted-foreground">+5.3% from last month</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="demographics">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="list">Customer List</TabsTrigger>
        </TabsList>
        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Demographics</CardTitle>
              <CardDescription>Analysis of customer base by demographics</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <CustomerChart />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Database</CardTitle>
              <CardDescription>Detailed list of customers and their information</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
