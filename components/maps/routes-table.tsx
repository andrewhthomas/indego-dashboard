"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { type RouteData } from "@/lib/trip-data";
import {
  getStationMapping,
  getStationName,
  type StationMapping,
} from "@/lib/station-mapping";

interface RoutesTableProps {
  routes: RouteData[];
  loading?: boolean;
}

type SortField = "count" | "startStation" | "endStation" | "distance";
type SortDirection = "asc" | "desc";

export function RoutesTable({ routes, loading = false }: RoutesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [stationMapping, setStationMapping] = useState<StationMapping>({});
  const [mappingLoading, setMappingLoading] = useState(true);

  // Load station name mapping
  useEffect(() => {
    const loadStationMapping = async () => {
      try {
        setMappingLoading(true);
        const mapping = await getStationMapping();
        setStationMapping(mapping);
      } catch (error) {
        console.error("Error loading station mapping:", error);
      } finally {
        setMappingLoading(false);
      }
    };

    loadStationMapping();
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Process and sort routes
  const processedRoutes = useMemo(() => {
    let filtered = routes.map((route) => ({
      ...route,
      distance: calculateDistance(
        route.startLat,
        route.startLon,
        route.endLat,
        route.endLon,
      ),
    }));

    // Filter based on search term (search both station IDs and names)
    if (searchTerm) {
      filtered = filtered.filter((route) => {
        const startName = getStationName(route.startStation, stationMapping);
        const endName = getStationName(route.endStation, stationMapping);
        const term = searchTerm.toLowerCase();

        return (
          route.startStation.toLowerCase().includes(term) ||
          route.endStation.toLowerCase().includes(term) ||
          startName.toLowerCase().includes(term) ||
          endName.toLowerCase().includes(term)
        );
      });
    }

    // Sort based on current sort field and direction
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "count":
          aValue = a.count;
          bValue = b.count;
          break;
        case "startStation":
          aValue = getStationName(a.startStation, stationMapping);
          bValue = getStationName(b.startStation, stationMapping);
          break;
        case "endStation":
          aValue = getStationName(a.endStation, stationMapping);
          bValue = getStationName(b.endStation, stationMapping);
          break;
        case "distance":
          aValue = a.distance;
          bValue = b.distance;
          break;
        default:
          aValue = a.count;
          bValue = b.count;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [routes, searchTerm, sortField, sortDirection, stationMapping]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const getIntensityColor = (count: number, maxCount: number) => {
    const intensity = count / maxCount;
    if (intensity >= 0.8) return "bg-red-500";
    if (intensity >= 0.6) return "bg-orange-500";
    if (intensity >= 0.4) return "bg-yellow-500";
    if (intensity >= 0.2) return "bg-blue-500";
    return "bg-gray-500";
  };

  const maxCount = Math.max(...routes.map((r) => r.count), 1);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
          <CardDescription>
            Most frequently used routes between stations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <div className="h-9 w-64 bg-muted animate-pulse rounded-md"></div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-6 w-12 bg-muted animate-pulse rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (routes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
          <CardDescription>
            Most frequently used routes between stations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Routes</CardTitle>
        <CardDescription>
          Most frequently used routes between stations ({processedRoutes.length}{" "}
          of {routes.length} routes shown)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by station name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("startStation")}
                        className="h-8 text-xs font-medium"
                      >
                        Start Station
                        {getSortIcon("startStation")}
                      </Button>
                    </th>
                    <th className="p-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("endStation")}
                        className="h-8 text-xs font-medium"
                      >
                        End Station
                        {getSortIcon("endStation")}
                      </Button>
                    </th>
                    <th className="p-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("distance")}
                        className="h-8 text-xs font-medium"
                      >
                        Distance
                        {getSortIcon("distance")}
                      </Button>
                    </th>
                    <th className="p-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("count")}
                        className="h-8 text-xs font-medium"
                      >
                        Trip Count
                        {getSortIcon("count")}
                      </Button>
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                      Popularity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedRoutes.map((route, index) => (
                    <tr
                      key={`${route.startStation}-${route.endStation}`}
                      className="border-b hover:bg-muted/25"
                    >
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {getStationName(route.startStation, stationMapping)}
                          </div>
                          {!mappingLoading &&
                            stationMapping[route.startStation] && (
                              <div className="text-xs text-muted-foreground font-mono">
                                ID: {route.startStation}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {getStationName(route.endStation, stationMapping)}
                          </div>
                          {!mappingLoading &&
                            stationMapping[route.endStation] && (
                              <div className="text-xs text-muted-foreground font-mono">
                                ID: {route.endStation}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {route.distance.toFixed(2)} mi
                      </td>
                      <td className="p-3 font-medium">
                        {route.count.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getIntensityColor(route.count, maxCount)}`}
                              style={{
                                width: `${(route.count / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {processedRoutes.length === 0 && searchTerm && (
            <div className="text-center py-4 text-muted-foreground">
              No routes found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
