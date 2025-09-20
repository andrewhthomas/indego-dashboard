"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Map, Table } from "lucide-react";
import { type RouteData } from "@/lib/trip-data";
import { RouteHeatmap } from "./route-heatmap";
import { RoutesTable } from "./routes-table";

interface RoutesViewerProps {
  routes: RouteData[];
  loading?: boolean;
}

type ViewMode = "map" | "table";

export function RoutesViewer({ routes, loading = false }: RoutesViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  if (loading) {
    return viewMode === "map" ? (
      <RouteHeatmap routes={[]} loading={true} />
    ) : (
      <RoutesTable routes={[]} loading={true} />
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Popular Routes</CardTitle>
              <CardDescription>
                Most frequently used routes between stations ({routes.length}{" "}
                routes)
              </CardDescription>
            </div>
            <div className="flex rounded-lg border p-1">
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="h-8 px-3"
              >
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                <Table className="h-4 w-4 mr-2" />
                Table View
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content based on view mode */}
      {viewMode === "map" ? (
        <RouteHeatmap routes={routes} loading={false} />
      ) : (
        <RoutesTable routes={routes} loading={false} />
      )}
    </div>
  );
}
