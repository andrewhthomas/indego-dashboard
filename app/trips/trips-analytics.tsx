"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadTripData, type ProcessedTripData } from "@/lib/trip-data";
import { TripStatsOverview } from "@/components/trip-stats-overview";
import { DailyTripChart } from "@/components/charts/daily-trip-chart";
import { HourlyDistributionChart } from "@/components/charts/hourly-distribution-chart";
import { BikeAvailabilityChart } from "@/components/charts/bike-availability-chart";
import { MonthFilter } from "@/components/month-filter";
import { RoutesViewer } from "@/components/maps/routes-viewer";
import { Skeleton } from "@/components/ui/skeleton";

export function TripsAnalytics() {
  const [tripData, setTripData] = useState<ProcessedTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadTripData(selectedMonth);
        setTripData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load trip data",
        );
        console.error("Error loading trip data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedMonth]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trip Analytics</h2>
          <p className="text-muted-foreground">
            Historical trip data analysis for Q2 2025
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>Error loading trip data: {error}</p>
              <p className="text-sm mt-2">
                Please ensure the CSV file is properly loaded and the API is
                accessible.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getFilterDescription = () => {
    if (selectedMonth === "all") {
      return `Comprehensive analysis of ${tripData?.stats.totalTrips.toLocaleString() || "loading"} trips from 2025`;
    }

    const [year, monthNum] = selectedMonth.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(monthNum) - 1,
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    return `Analysis of ${tripData?.stats.totalTrips.toLocaleString() || "loading"} trips from ${monthName}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-3 md:mb-0">
          <h2 className="text-3xl font-bold tracking-tight">Trip Analytics</h2>
          <p className="text-muted-foreground">{getFilterDescription()}</p>
        </div>
        <MonthFilter value={selectedMonth} onValueChange={setSelectedMonth} />
      </div>

      <TripStatsOverview stats={tripData?.stats || null} loading={loading} />

      {/* Show message when no data is available for selected month */}
      {!loading &&
        tripData?.stats &&
        tripData.stats.totalTrips === 0 &&
        selectedMonth !== "all" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <div className="mb-2">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium">No trip data available</h3>
                <p className="text-sm">
                  There are no bike trips recorded for the selected month. Try
                  selecting a different month or view all data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Only show tabs when we have data */}
      {!loading && tripData?.stats && tripData.stats.totalTrips > 0 && (
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto min-h-[4.5rem] lg:min-h-[2.25rem]">
            <TabsTrigger value="daily">
              <span className="hidden sm:inline">Daily Trends</span>
              <span className="sm:hidden">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="hourly">
              <span className="hidden sm:inline">Hourly Patterns</span>
              <span className="sm:hidden">Hourly</span>
            </TabsTrigger>
            <TabsTrigger value="bikes">
              <span className="hidden sm:inline">Bike Types</span>
              <span className="sm:hidden">Bikes</span>
            </TabsTrigger>
            <TabsTrigger value="routes">
              <span className="hidden sm:inline">Popular Routes</span>
              <span className="sm:hidden">Routes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Trip Volume</CardTitle>
                <CardDescription>
                  Trip count by day for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <div className="h-full space-y-4 p-4">
                    <div className="flex justify-between mb-6">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-end justify-center space-x-2 h-48">
                      <Skeleton className="h-8 w-4" />
                      <Skeleton className="h-16 w-4" />
                      <Skeleton className="h-24 w-4" />
                      <Skeleton className="h-32 w-4" />
                      <Skeleton className="h-20 w-4" />
                      <Skeleton className="h-12 w-4" />
                      <Skeleton className="h-28 w-4" />
                      <Skeleton className="h-36 w-4" />
                      <Skeleton className="h-16 w-4" />
                      <Skeleton className="h-24 w-4" />
                      <Skeleton className="h-40 w-4" />
                      <Skeleton className="h-20 w-4" />
                    </div>
                    <div className="flex justify-center space-x-4 mt-6">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ) : tripData?.stats.dailyTrips ? (
                  <DailyTripChart data={tripData.stats.dailyTrips} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No daily trip data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hourly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Usage Patterns</CardTitle>
                <CardDescription>
                  Trip distribution by hour of day
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <div className="h-full space-y-4 p-4">
                    <div className="flex justify-between mb-6">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-end justify-center space-x-1 h-48">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className={`w-3 ${
                            i >= 6 && i <= 9
                              ? "h-32" // Morning peak
                              : i >= 17 && i <= 19
                                ? "h-40" // Evening peak
                                : i >= 10 && i <= 16
                                  ? "h-16" // Daytime
                                  : "h-8" // Night
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-center space-x-4 mt-6">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ) : tripData?.stats.hourlyDistribution ? (
                  <HourlyDistributionChart
                    data={tripData.stats.hourlyDistribution}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No hourly data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bikes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bike Type Distribution</CardTitle>
                  <CardDescription>
                    Standard vs Electric bike usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="relative">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Skeleton className="h-16 w-16 rounded-full bg-background" />
                        </div>
                      </div>
                    </div>
                  ) : tripData?.stats.bikeTypeBreakdown ? (
                    <BikeAvailabilityChart
                      classicBikes={tripData.stats.bikeTypeBreakdown.standard}
                      electricBikes={tripData.stats.bikeTypeBreakdown.electric}
                      smartBikes={0}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No bike type data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trip Statistics</CardTitle>
                  <CardDescription>Key metrics and insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="text-muted-foreground">
                      Loading statistics...
                    </div>
                  ) : tripData?.stats ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Electric Bike Trips:</span>
                        <span className="font-medium">
                          {tripData.stats.bikeTypeBreakdown.electric.toLocaleString()}
                          <span className="text-muted-foreground ml-1">
                            (
                            {Math.round(
                              (tripData.stats.bikeTypeBreakdown.electric /
                                tripData.stats.totalTrips) *
                                100,
                            )}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Standard Bike Trips:</span>
                        <span className="font-medium">
                          {tripData.stats.bikeTypeBreakdown.standard.toLocaleString()}
                          <span className="text-muted-foreground ml-1">
                            (
                            {Math.round(
                              (tripData.stats.bikeTypeBreakdown.standard /
                                tripData.stats.totalTrips) *
                                100,
                            )}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm">Avg Trip Distance:</span>
                          <span className="font-medium">
                            {(
                              tripData.stats.tripsWithDistance > 0
                                ? tripData.stats.totalDistance /
                                  tripData.stats.tripsWithDistance
                                : 0
                            ).toFixed(2)}{" "}
                            mi
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      No statistics available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <RoutesViewer
              routes={tripData?.stats.popularRoutes || []}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
