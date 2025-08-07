"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchSystemStats, type SystemStats } from "@/lib/api"
import { Bike, MapPin, Activity, Clock } from "lucide-react"

export function DashboardStats() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchSystemStats()
      setStats(data)
      setLoading(false)
    }
    
    loadStats()
    const interval = setInterval(loadStats, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: "Available Bikes",
      value: stats?.availableBikes ?? "--",
      icon: Bike,
      description: loading ? "Loading data..." : "Currently available",
    },
    {
      title: "Total Stations",
      value: stats?.totalStations ?? "--",
      icon: MapPin,
      description: loading ? "Loading data..." : "Active stations",
    },
    {
      title: "Available Docks",
      value: stats?.availableDocks ?? "--",
      icon: Activity,
      description: loading ? "Loading data..." : "Open parking spots",
    },
    {
      title: "System Capacity",
      value: stats ? `${Math.round((stats.availableBikes / (stats.totalDocks || 1)) * 100)}%` : "--",
      icon: Clock,
      description: loading ? "Loading data..." : "Bikes in use",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}