"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function SalesTable() {
  const sales = [
    {
      id: "ORD-001",
      date: "2023-04-01",
      customer: "John Smith",
      amount: "$129.99",
      status: "Completed",
    },
    {
      id: "ORD-002",
      date: "2023-04-02",
      customer: "Sarah Johnson",
      amount: "$79.95",
      status: "Completed",
    },
    {
      id: "ORD-003",
      date: "2023-04-03",
      customer: "Michael Brown",
      amount: "$249.50",
      status: "Processing",
    },
    {
      id: "ORD-004",
      date: "2023-04-04",
      customer: "Emily Davis",
      amount: "$59.99",
      status: "Completed",
    },
    {
      id: "ORD-005",
      date: "2023-04-05",
      customer: "David Wilson",
      amount: "$149.95",
      status: "Cancelled",
    },
    {
      id: "ORD-006",
      date: "2023-04-06",
      customer: "Lisa Martinez",
      amount: "$89.99",
      status: "Processing",
    },
    {
      id: "ORD-007",
      date: "2023-04-07",
      customer: "Robert Taylor",
      amount: "$199.99",
      status: "Completed",
    },
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell className="font-medium">{sale.id}</TableCell>
            <TableCell>{sale.date}</TableCell>
            <TableCell>{sale.customer}</TableCell>
            <TableCell>{sale.amount}</TableCell>
            <TableCell>
              <Badge
                variant={
                  sale.status === "Completed" ? "default" : sale.status === "Processing" ? "outline" : "destructive"
                }
              >
                {sale.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
