"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function CustomerTable() {
  const customers = [
    {
      id: "CUST-001",
      name: "John Smith",
      email: "john.smith@example.com",
      orders: 12,
      spent: "$1,245.50",
      joined: "2022-01-15",
    },
    {
      id: "CUST-002",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      orders: 8,
      spent: "$879.25",
      joined: "2022-02-20",
    },
    {
      id: "CUST-003",
      name: "Michael Brown",
      email: "michael.b@example.com",
      orders: 5,
      spent: "$432.75",
      joined: "2022-03-10",
    },
    {
      id: "CUST-004",
      name: "Emily Davis",
      email: "emily.d@example.com",
      orders: 15,
      spent: "$1,587.30",
      joined: "2021-11-05",
    },
    {
      id: "CUST-005",
      name: "David Wilson",
      email: "david.w@example.com",
      orders: 3,
      spent: "$245.99",
      joined: "2022-04-18",
    },
    {
      id: "CUST-006",
      name: "Lisa Martinez",
      email: "lisa.m@example.com",
      orders: 9,
      spent: "$932.45",
      joined: "2022-01-30",
    },
    {
      id: "CUST-007",
      name: "Robert Taylor",
      email: "robert.t@example.com",
      orders: 7,
      spent: "$654.20",
      joined: "2022-02-15",
    },
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Total Spent</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">{customer.id}</TableCell>
            <TableCell>{customer.name}</TableCell>
            <TableCell>{customer.email}</TableCell>
            <TableCell>{customer.orders}</TableCell>
            <TableCell>{customer.spent}</TableCell>
            <TableCell>{customer.joined}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
