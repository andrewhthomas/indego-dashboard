"use client";

import { useEffect } from "react";
import { MapContainer, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Station } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Bike, Zap, Brain, MapPin } from "lucide-react";
import { ThemeAwareTileLayer } from "./theme-aware-tile-layer";

interface StationMapEnhancedProps {
  stations: Station[];
  selectedStation?: string | null;
  onStationClick?: (stationId: string) => void;
}

export function StationMapEnhanced({
  stations,
  selectedStation,
  onStationClick,
}: StationMapEnhancedProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "/marker-icon.png",
      iconRetinaUrl: "/marker-icon-2x.png",
      shadowUrl: "/marker-shadow.png",
    });
  }, []);

  // Philadelphia center coordinates
  const center: [number, number] = [39.9526, -75.1652];

  const getMarkerColor = (station: Station) => {
    if (station.kioskPublicStatus !== "Active") return "#6b7280"; // gray
    if (station.bikesAvailable === 0) return "#dc2626"; // red
    if (station.bikesAvailable < 5) return "#f59e0b"; // amber
    return "#16a34a"; // green
  };

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <ThemeAwareTileLayer />
      {stations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lng]}
          radius={selectedStation === station.id ? 12 : 8}
          fillColor={getMarkerColor(station)}
          color={selectedStation === station.id ? "#1e40af" : "#fff"}
          weight={selectedStation === station.id ? 3 : 2}
          opacity={1}
          fillOpacity={0.8}
          eventHandlers={{
            click: () => onStationClick?.(station.id),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[250px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{station.name}</h3>
                <Badge
                  variant={
                    station.kioskPublicStatus === "Active"
                      ? "default"
                      : "secondary"
                  }
                >
                  {station.kioskPublicStatus}
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4" />
                    <span className="text-sm">Classic</span>
                  </div>
                  <span className="font-medium">
                    {station.classicBikesAvailable}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Electric</span>
                  </div>
                  <span className="font-medium">
                    {station.electricBikesAvailable}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm">Smart</span>
                  </div>
                  <span className="font-medium">
                    {station.smartBikesAvailable}
                  </span>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Available Docks</span>
                  <span className="font-medium">
                    {station.docksAvailable}/{station.totalDocks}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-2">
                <MapPin className="h-3 w-3 inline mr-1" />
                {station.addressStreet}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
