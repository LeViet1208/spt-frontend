"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function InventoryTable() {
  const inventory = [
    {
      id: "PRD-001",
      name: "Wireless Headphones",
      category: "Electronics",
      stock: 45,
      price: "$89.99",
      status: "In Stock",
    },
    {
      id: "PRD-002",
      name: "Smart Watch",
      category: "Electronics",
      stock: 12,
      price: "$199.99",
      status: "Low Stock",
    },
    {
      id: "PRD-003",
      name: "Cotton T-Shirt",
      category: "Clothing",
      stock: 120,
      price: "$24.99",
      status: "In Stock",
    },
    {
      id: "PRD-004",
      name: "Desk Lamp",
      category: "Home Goods",
      stock: 0,
      price: "$49.99",
      status: "Out of Stock",
    },
    {
      id: "PRD-005",
      name: "Coffee Maker",
      category: "Home Goods",
      stock: 8,
      price: "$79.99",
      status: "Low Stock",
    },
    {
      id: "PRD-006",
      name: "Bluetooth Speaker",
      category: "Electronics",
      stock: 35,
      price: "$59.99",
      status: "In Stock",
    },
    {
      id: "PRD-007",
      name: "Denim Jeans",
      category: "Clothing",
      stock: 85,
      price: "$39.99",
      status: "In Stock",
    },
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.id}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.category}</TableCell>
            <TableCell>{item.stock}</TableCell>
            <TableCell>{item.price}</TableCell>
            <TableCell>
              <Badge
                variant={
                  item.status === "In Stock" ? "default" : item.status === "Low Stock" ? "outline" : "destructive"
                }
              >
                {item.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
