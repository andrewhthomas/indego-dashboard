"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { fetchStationStatus, type Station } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Dynamic import to avoid SSR issues with Leaflet
const StationMap = dynamic(
  () => import("@/components/maps/station-map").then(mod => mod.StationMap),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading map...
      </div>
    )
  }
)

export function StationMapClient() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStations = async () => {
      const data = await fetchStationStatus()
      setStations(data)
      setLoading(false)
    }
    
    loadStations()
    const interval = setInterval(loadStations, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle>Station Locations</CardTitle>
        <CardDescription>
          {loading 
            ? "Loading station data..." 
            : `${stations.length} stations • Click on stations to view availability`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[500px] p-0">
        <StationMap stations={stations} />
      </CardContent>
    </Card>
  )
}