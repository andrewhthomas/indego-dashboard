"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type TripStats } from "@/lib/trip-data"
import { Bike, Clock, Route, TrendingUp, Calendar, Users } from "lucide-react"
import { PlaceholderText } from "@/components/ui/placeholder-text"

interface TripStatsOverviewProps {
  stats: TripStats | null
  loading?: boolean
}

export function TripStatsOverview({ stats, loading = false }: TripStatsOverviewProps) {

  const statCards = [
    {
      title: "Total Trips",
      value: loading ? "123,456" : (stats?.totalTrips.toLocaleString() ?? "--"),
      icon: Bike,
      description: loading ? "Loading data..." : "2025",
      color: "text-blue-600",
    },
    {
      title: "Avg Duration",
      value: loading ? "15 min" : (stats ? `${stats.averageDuration} min` : "--"),
      icon: Clock,
      description: loading ? "Calculating..." : "Per trip",
      color: "text-green-600",
    },
    {
      title: "Total Distance",
      value: loading ? "12,345 mi" : (stats ? `${stats.totalDistance.toLocaleString()} mi` : "--"),
      icon: Route,
      description: loading ? "Processing..." : "Combined",
      color: "text-purple-600",
    },
    {
      title: "Electric Bikes",
      value: loading ? "45%" : (stats ? `${Math.round((stats.bikeTypeBreakdown.electric / stats.totalTrips) * 100)}%` : "--"),
      icon: TrendingUp,
      description: loading ? "Analyzing..." : "Of all trips",
      color: "text-yellow-600",
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
              <div className="text-2xl font-bold">
                <PlaceholderText loading={loading}>
                  {stat.value}
                </PlaceholderText>
              </div>
              <p className="text-xs text-muted-foreground">
                <PlaceholderText loading={loading}>
                  {stat.description}
                </PlaceholderText>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Peak Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Peak Hour:</span>
              <span className="font-medium">
                <PlaceholderText loading={loading}>
                  {loading ? "14:00-15:00" : (stats?.peakHour || "--")}
                </PlaceholderText>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Most Popular Start:</span>
              <span className="font-medium">
                <PlaceholderText loading={loading}>
                  {loading ? "Station 3025" : `Station ${stats?.mostPopularStartStation || "--"}`}
                </PlaceholderText>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Most Popular End:</span>
              <span className="font-medium">
                <PlaceholderText loading={loading}>
                  {loading ? "Station 3045" : `Station ${stats?.mostPopularEndStation || "--"}`}
                </PlaceholderText>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membership Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                // Show placeholder membership types when loading
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      <PlaceholderText loading={true}>Indego30</PlaceholderText>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        <PlaceholderText loading={true}>85,432</PlaceholderText>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <PlaceholderText loading={true}>(65%)</PlaceholderText>
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      <PlaceholderText loading={true}>Indego365</PlaceholderText>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        <PlaceholderText loading={true}>32,156</PlaceholderText>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <PlaceholderText loading={true}>(25%)</PlaceholderText>
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      <PlaceholderText loading={true}>Walk-up</PlaceholderText>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        <PlaceholderText loading={true}>12,867</PlaceholderText>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <PlaceholderText loading={true}>(10%)</PlaceholderText>
                      </span>
                    </div>
                  </div>
                </>
              ) : stats ? (
                Object.entries(stats.passholderTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">{type}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{count.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((count / stats.totalTrips) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">No membership data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}