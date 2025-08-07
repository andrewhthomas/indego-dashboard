"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface HourlyDistributionChartProps {
  data: Array<{
    hour: number
    trips: number
  }>
}

export function HourlyDistributionChart({ data }: HourlyDistributionChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    hourLabel: `${item.hour.toString().padStart(2, '0')}:00`
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="hourLabel" 
          className="text-xs"
          interval={1}
        />
        <YAxis className="text-xs" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)"
          }}
          labelFormatter={(label) => `Hour: ${label}`}
          formatter={(value) => [value, 'Trips']}
        />
        <Bar 
          dataKey="trips" 
          fill="hsl(var(--primary))"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}