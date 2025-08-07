"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loadTripData, type TripStats } from "@/lib/trip-data"
import { TrendingUp, Clock, Route } from "lucide-react"

export function TripInsightsCard() {
  const [stats, setStats] = useState<TripStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await loadTripData()
        setStats(data.stats)
      } catch (error) {
        console.error('Error loading trip insights:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trip Insights</CardTitle>
          <CardDescription>Loading Q2 2025 trip data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          Loading insights...
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trip Insights</CardTitle>
          <CardDescription>Q2 2025 trip analysis</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          Unable to load trip data
        </CardContent>
      </Card>
    )
  }

  // Calculate some interesting insights
  const electricPercentage = Math.round((stats.bikeTypeBreakdown.electric / stats.totalTrips) * 100)
  const avgDailyTrips = Math.round(stats.totalTrips / stats.dailyTrips.length)
  
  // Find the most active day
  const mostActiveDay = stats.dailyTrips.reduce((max, day) => 
    day.trips > max.trips ? day : max, { date: '', trips: 0 })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Insights</CardTitle>
        <CardDescription>
          Analysis of {stats.totalTrips.toLocaleString()} trips from Q2 2025
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-xl font-bold">{electricPercentage}%</div>
            <div className="text-xs text-muted-foreground">Electric</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-xl font-bold">{stats.averageDuration}</div>
            <div className="text-xs text-muted-foreground">Avg Min</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <Route className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-xl font-bold">{avgDailyTrips}</div>
            <div className="text-xs text-muted-foreground">Daily Avg</div>
          </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Peak Hour:</span>
            <span className="font-medium">{stats.peakHour}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Most Active Day:</span>
            <span className="font-medium">
              {new Date(mostActiveDay.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })} ({mostActiveDay.trips.toLocaleString()} trips)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}