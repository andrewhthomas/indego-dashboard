"use client"

import { useEffect } from "react"
import { MapContainer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { ThemeAwareTileLayer } from "./theme-aware-tile-layer"

// Fix for default markers in React-Leaflet
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  bikesAvailable?: number
  docksAvailable?: number
}

interface StationMapProps {
  stations: Station[]
}

export function StationMap({ stations }: StationMapProps) {
  useEffect(() => {
    // Fix for Leaflet icon issue in Next.js
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: "/marker-icon.png",
      iconRetinaUrl: "/marker-icon-2x.png",
      shadowUrl: "/marker-shadow.png",
    })
  }, [])

  // Philadelphia center coordinates
  const center: [number, number] = [39.9526, -75.1652]

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <ThemeAwareTileLayer />
      {stations.map((station) => (
        <Marker 
          key={station.id} 
          position={[station.lat, station.lng]}
          icon={icon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{station.name}</h3>
              {station.bikesAvailable !== undefined && (
                <p>Bikes available: {station.bikesAvailable}</p>
              )}
              {station.docksAvailable !== undefined && (
                <p>Docks available: {station.docksAvailable}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}