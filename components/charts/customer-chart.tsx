"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function CustomerChart() {
  const data = [
    { name: "18-24", male: 400, female: 400 },
    { name: "25-34", male: 600, female: 500 },
    { name: "35-44", male: 500, female: 400 },
    { name: "45-54", male: 300, female: 300 },
    { name: "55-64", male: 200, female: 200 },
    { name: "65+", male: 100, female: 150 },
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
        <Bar dataKey="male" fill="#8884d8" name="Male" />
        <Bar dataKey="female" fill="#82ca9d" name="Female" />
      </BarChart>
    </ResponsiveContainer>
  )
}
