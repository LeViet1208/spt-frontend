"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function SalesChart() {
  const data = [
    { name: "Jan", sales: 4000, revenue: 2400 },
    { name: "Feb", sales: 3000, revenue: 1398 },
    { name: "Mar", sales: 2000, revenue: 9800 },
    { name: "Apr", sales: 2780, revenue: 3908 },
    { name: "May", sales: 1890, revenue: 4800 },
    { name: "Jun", sales: 2390, revenue: 3800 },
    { name: "Jul", sales: 3490, revenue: 4300 },
    { name: "Aug", sales: 3490, revenue: 4300 },
    { name: "Sep", sales: 3490, revenue: 4300 },
    { name: "Oct", sales: 3490, revenue: 4300 },
    { name: "Nov", sales: 3490, revenue: 4300 },
    { name: "Dec", sales: 3490, revenue: 4300 },
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="sales" fill="#8884d8" name="Sales" />
        <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  )
}
