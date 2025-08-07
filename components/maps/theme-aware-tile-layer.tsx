"use client"

import { useEffect } from "react"
import { TileLayer, useMap } from "react-leaflet"
import { useTheme } from "next-themes"

export function ThemeAwareTileLayer() {
  const { resolvedTheme } = useTheme()
  const map = useMap()
  
  // Determine theme type
  const isDark = resolvedTheme === 'dark'
  
  // Tile layer URLs
  const lightTileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  
  // Select appropriate tile URL
  const tileUrl = isDark ? darkTileUrl : lightTileUrl
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

  // Force map to refresh when theme changes
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }
  }, [map, resolvedTheme])

  return (
    <TileLayer
      key={resolvedTheme || 'system'} // Force re-render when theme changes
      attribution={tileAttribution}
      url={tileUrl}
    />
  )
}