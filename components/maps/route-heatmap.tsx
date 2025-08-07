"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type RouteData } from "@/lib/trip-data"
import { Skeleton } from "@/components/ui/skeleton"
import "leaflet/dist/leaflet.css"

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })
const ThemeAwareTileLayer = dynamic(() => import('./theme-aware-tile-layer').then(mod => mod.ThemeAwareTileLayer), { ssr: false })

interface RouteHeatmapProps {
  routes: RouteData[]
  loading?: boolean
}

export function RouteHeatmap({ routes, loading = false }: RouteHeatmapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
          <CardDescription>Most frequently used routes between stations</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          <div className="h-full space-y-4 p-4">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
          <CardDescription>Most frequently used routes between stations</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          <div className="h-full space-y-4 p-4">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-full w-full rounded-md" />
            <div className="absolute bottom-8 right-8 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (routes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
          <CardDescription>Most frequently used routes between stations</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mb-2">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <p>No route data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate max count for color scaling
  const maxCount = Math.max(...routes.map(route => route.count))
  const minCount = Math.min(...routes.map(route => route.count))

  // Function to get color and weight based on trip count
  const getRouteStyle = (count: number) => {
    const intensity = (count - minCount) / (maxCount - minCount)
    
    // Color scale from blue (low) to red (high)
    const red = Math.round(intensity * 255)
    const blue = Math.round((1 - intensity) * 255)
    const green = Math.round((1 - Math.abs(intensity - 0.5) * 2) * 100)
    
    return {
      color: `rgb(${red}, ${green}, ${blue})`,
      weight: Math.max(2, intensity * 8), // Line thickness from 2 to 8 pixels
      opacity: Math.max(0.4, intensity * 0.8 + 0.2) // Opacity from 0.4 to 1.0
    }
  }

  // Center map on Philadelphia
  const centerLat = 39.9526
  const centerLon = -75.1652

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Routes</CardTitle>
        <CardDescription>
          Most frequently used routes between stations ({routes.length} routes shown)
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[500px]">
        <div className="h-full w-full relative">
          <MapContainer
            center={[centerLat, centerLon]}
            zoom={12}
            className="h-full w-full rounded-md"
            style={{ height: '100%', width: '100%' }}
          >
            <ThemeAwareTileLayer />
            
            {routes.map((route, index) => {
              const style = getRouteStyle(route.count)
              
              return (
                <Polyline
                  key={`${route.startStation}-${route.endStation}-${index}`}
                  positions={[
                    [route.startLat, route.startLon],
                    [route.endLat, route.endLon]
                  ]}
                  pathOptions={style}
                  eventHandlers={{
                    mouseover: (e) => {
                      const layer = e.target
                      layer.bindTooltip(
                        `Station ${route.startStation} → Station ${route.endStation}<br/>
                         ${route.count} trips`,
                        { permanent: false, direction: 'top' }
                      ).openTooltip()
                    },
                    mouseout: (e) => {
                      const layer = e.target
                      layer.closeTooltip()
                    }
                  }}
                />
              )
            })}
          </MapContainer>
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="text-sm font-medium mb-2">Trip Frequency</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span className="text-xs">{minCount} trips</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500"></div>
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500"></div>
                <span className="text-xs">{maxCount} trips</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}