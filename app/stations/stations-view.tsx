"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchStationStatus, type Station } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StationTable } from "@/components/station-table";
import { StationDetailDialog } from "@/components/station-detail-dialog";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic import to avoid SSR issues with Leaflet
const StationMapEnhanced = dynamic(
  () =>
    import("@/components/maps/station-map-enhanced").then(
      (mod) => mod.StationMapEnhanced,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading map...
      </div>
    ),
  },
);

export function StationsView() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [detailStation, setDetailStation] = useState<Station | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStations = async () => {
    setLoading(true);
    const data = await fetchStationStatus();
    setStations(data);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadStations();
    const interval = setInterval(loadStations, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleStationClick = (station: Station) => {
    setDetailStation(station);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Station Status</h2>
          <p className="text-muted-foreground">
            Real-time bike and dock availability across Philadelphia
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadStations}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Station Locations</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading station data..."
                  : `${stations.length} stations • ${stations.filter((s) => s.kioskPublicStatus === "Active").length} active`}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <StationMapEnhanced
                stations={stations}
                selectedStation={selectedStation}
                onStationClick={setSelectedStation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Station List</CardTitle>
              <CardDescription>
                Search and filter stations by name or location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StationTable
                stations={stations}
                onStationClick={handleStationClick}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StationDetailDialog
        station={detailStation}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}
