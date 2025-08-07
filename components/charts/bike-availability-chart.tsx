"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface BikeAvailabilityChartProps {
  classicBikes: number
  electricBikes: number
  smartBikes: number
}

export function BikeAvailabilityChart({ classicBikes, electricBikes, smartBikes }: BikeAvailabilityChartProps) {
  const data = [
    { name: "Classic", value: classicBikes, color: "#6b7280" },
    { name: "Electric", value: electricBikes, color: "#f59e0b" },
    { name: "Smart", value: smartBikes, color: "#6366f1" },
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}