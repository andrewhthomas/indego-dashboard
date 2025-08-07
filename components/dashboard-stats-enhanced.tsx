"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchSystemStats, type SystemStats } from "@/lib/api"
import { Bike, MapPin, Activity, Zap, Brain, TrendingUp } from "lucide-react"

export function DashboardStatsEnhanced() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchSystemStats()
      setStats(data)
      setLoading(false)
    }
    
    loadStats()
    const interval = setInterval(loadStats, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: "Available Bikes",
      value: stats?.availableBikes ?? "--",
      icon: Bike,
      description: loading ? "Loading..." : "Ready to ride",
      color: "text-green-600",
    },
    {
      title: "Active Stations",
      value: stats ? `${stats.activeStations}/${stats.totalStations}` : "--",
      icon: MapPin,
      description: loading ? "Loading..." : "Stations online",
      color: "text-blue-600",
    },
    {
      title: "Available Docks",
      value: stats?.availableDocks ?? "--",
      icon: Activity,
      description: loading ? "Loading..." : "Parking spots",
      color: "text-purple-600",
    },
    {
      title: "System Usage",
      value: stats ? `${Math.round((stats.availableBikes / (stats.totalDocks || 1)) * 100)}%` : "--",
      icon: TrendingUp,
      description: loading ? "Loading..." : "Bikes available",
      color: "text-orange-600",
    },
  ]

  const bikeTypeCards = [
    {
      title: "Classic Bikes",
      value: stats?.classicBikes ?? "--",
      icon: Bike,
      color: "text-gray-600",
    },
    {
      title: "Electric Bikes",
      value: stats?.electricBikes ?? "--",
      icon: Zap,
      color: "text-yellow-600",
    },
    {
      title: "Smart Bikes",
      value: stats?.smartBikes ?? "--",
      icon: Brain,
      color: "text-indigo-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bike Types Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {bikeTypeCards.map((bike, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <bike.icon className={`h-5 w-5 ${bike.color}`} />
                  <div>
                    <p className="text-sm font-medium">{bike.title}</p>
                    <p className="text-2xl font-bold">{bike.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {stats && (
            <div className="mt-4 text-sm text-muted-foreground">
              Total bikes in system: {stats.totalBikes} across {stats.totalStations} stations
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}