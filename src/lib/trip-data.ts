import Papa from "papaparse";

export interface TripRecord {
  trip_id: string;
  duration: number;
  start_time: string;
  end_time: string;
  start_station: string;
  start_lat: number;
  start_lon: number;
  end_station: string;
  end_lat: number;
  end_lon: number;
  bike_id: string;
  plan_duration: number;
  trip_route_category: string;
  passholder_type: string;
  bike_type: "standard" | "electric";
}

export interface RouteData {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  count: number;
  startStation: string;
  endStation: string;
}

export interface TripStats {
  totalTrips: number;
  averageDuration: number;
  totalDistance: number;
  tripsWithDistance: number;
  mostPopularStartStation: string;
  mostPopularEndStation: string;
  peakHour: string;
  bikeTypeBreakdown: {
    standard: number;
    electric: number;
  };
  passholderTypeBreakdown: {
    [key: string]: number;
  };
  dailyTrips: Array<{
    date: string;
    trips: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    trips: number;
  }>;
  popularRoutes: RouteData[];
}

export interface ProcessedTripData {
  trips: TripRecord[];
  stats: TripStats;
}

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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
}

// Served from R2 by src/pages/api/trips/[file].ts
const TRIPS_BASE_URL = "/api/trips";
export const QUARTER_FILES = [
  "indego-trips-2025-q1.csv",
  "indego-trips-2025-q2.csv",
  "indego-trips-2025-q3.csv",
  "indego-trips-2025-q4.csv",
  "indego-trips-2026-q1.csv",
  "indego-trips-2026-q2.csv",
];

// Every month covered by QUARTER_FILES, oldest first
const DATA_MONTHS = QUARTER_FILES.flatMap((file) => {
  const match = /(\d{4})-q([1-4])/.exec(file);
  if (!match) return [];
  const year = Number(match[1]);
  const firstMonth = (Number(match[2]) - 1) * 3;
  return [0, 1, 2].map((offset) => ({ year, month: firstMonth + offset }));
});

const monthLabel = (
  { year, month }: { year: number; month: number },
  format: "long" | "short",
) =>
  new Date(year, month, 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: format,
  });

/** e.g. "Jan 2025 to Jun 2026" */
export const DATA_RANGE_LABEL = `${monthLabel(DATA_MONTHS[0], "short")} to ${monthLabel(DATA_MONTHS[DATA_MONTHS.length - 1], "short")}`;

function parseCsv(csvText: string): Promise<TripRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<TripRecord>(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string, header: string) => {
        if (
          [
            "duration",
            "start_lat",
            "start_lon",
            "end_lat",
            "end_lon",
            "plan_duration",
          ].includes(header)
        ) {
          return parseFloat(value) || 0;
        }
        return value;
      },
      complete: (results) => resolve(results.data),
      error: (error: unknown) => reject(error),
    });
  });
}

export async function loadTripData(
  monthFilter?: string,
): Promise<ProcessedTripData> {
  try {
    // Fetch all quarter CSVs in parallel
    const responses = await Promise.all(
      QUARTER_FILES.map((file) => fetch(`${TRIPS_BASE_URL}/${file}`)),
    );

    const failedIdx = responses.findIndex((r) => !r.ok);
    if (failedIdx !== -1) {
      throw new Error(`Failed to fetch ${QUARTER_FILES[failedIdx]}`);
    }

    const csvTexts = await Promise.all(responses.map((r) => r.text()));
    const parsedArrays = await Promise.all(csvTexts.map(parseCsv));
    let trips = parsedArrays.flat();

    // Apply month filter if specified
    if (monthFilter && monthFilter !== "all") {
      trips = trips.filter((trip) => {
        const tripDate = new Date(trip.start_time);
        const tripMonth = `${tripDate.getFullYear()}-${String(tripDate.getMonth() + 1).padStart(2, "0")}`;
        return tripMonth === monthFilter;
      });
    }

    const stats = calculateTripStats(trips);
    return { trips, stats };
  } catch (error) {
    console.error("Error loading trip data:", error);
    throw error;
  }
}

// Month filter options for every month in the loaded data
export async function getAvailableMonths(): Promise<
  Array<{ value: string; label: string }>
> {
  const months = DATA_MONTHS.map((m) => ({
    value: `${m.year}-${String(m.month + 1).padStart(2, "0")}`,
    label: monthLabel(m, "long"),
  }));

  return [{ value: "all", label: "All Months" }, ...months];
}

function calculateTripStats(trips: TripRecord[]): TripStats {
  const totalTrips = trips.length;

  // Handle empty dataset
  if (totalTrips === 0) {
    return {
      totalTrips: 0,
      averageDuration: 0,
      totalDistance: 0,
      tripsWithDistance: 0,
      mostPopularStartStation: "",
      mostPopularEndStation: "",
      peakHour: "",
      bikeTypeBreakdown: { standard: 0, electric: 0 },
      passholderTypeBreakdown: {},
      dailyTrips: [],
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        trips: 0,
      })),
      popularRoutes: [],
    };
  }

  const totalDuration = trips.reduce((sum, trip) => sum + trip.duration, 0);
  const averageDuration = Math.round(totalDuration / totalTrips);

  // Calculate total distance (skip trips with missing coordinates)
  let tripsWithDistance = 0;
  const totalDistance = trips.reduce((sum, trip) => {
    if (!trip.start_lat || !trip.start_lon || !trip.end_lat || !trip.end_lon) {
      return sum;
    }
    tripsWithDistance++;
    return (
      sum +
      calculateDistance(
        trip.start_lat,
        trip.start_lon,
        trip.end_lat,
        trip.end_lon,
      )
    );
  }, 0);

  // Station popularity
  const startStations: { [key: string]: number } = {};
  const endStations: { [key: string]: number } = {};

  // Bike type breakdown
  const bikeTypeBreakdown = { standard: 0, electric: 0 };

  // Passholder type breakdown
  const passholderTypeBreakdown: { [key: string]: number } = {};

  // Daily trips aggregation
  const dailyTripsMap: { [key: string]: number } = {};

  // Hourly distribution
  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    trips: 0,
  }));

  trips.forEach((trip) => {
    // Station popularity
    startStations[trip.start_station] =
      (startStations[trip.start_station] || 0) + 1;
    endStations[trip.end_station] = (endStations[trip.end_station] || 0) + 1;

    // Bike type
    if (trip.bike_type === "electric") {
      bikeTypeBreakdown.electric++;
    } else {
      bikeTypeBreakdown.standard++;
    }

    // Passholder type
    passholderTypeBreakdown[trip.passholder_type] =
      (passholderTypeBreakdown[trip.passholder_type] || 0) + 1;

    // Daily trips
    const date = new Date(trip.start_time).toISOString().split("T")[0];
    dailyTripsMap[date] = (dailyTripsMap[date] || 0) + 1;

    // Hourly distribution
    const hour = new Date(trip.start_time).getHours();
    if (hour >= 0 && hour < 24) {
      hourlyDistribution[hour].trips++;
    }
  });

  // Find most popular stations
  const mostPopularStartStation =
    Object.entries(startStations).sort(([, a], [, b]) => b - a)[0]?.[0] || "";
  const mostPopularEndStation =
    Object.entries(endStations).sort(([, a], [, b]) => b - a)[0]?.[0] || "";

  // Find peak hour
  const peakHourData = hourlyDistribution.reduce(
    (max, current) => (current.trips > max.trips ? current : max),
    { hour: 0, trips: 0 },
  );
  const peakHour = `${peakHourData.hour}:00-${peakHourData.hour + 1}:00`;

  // Convert daily trips to array and sort by date
  const dailyTrips = Object.entries(dailyTripsMap)
    .map(([date, trips]) => ({ date, trips }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Process popular routes
  const routeMap: { [key: string]: RouteData } = {};

  trips.forEach((trip) => {
    // Skip trips with invalid coordinates
    if (!trip.start_lat || !trip.start_lon || !trip.end_lat || !trip.end_lon) {
      return;
    }

    // Create a unique key for each route (start -> end)
    const routeKey = `${trip.start_station}-${trip.end_station}`;

    if (routeMap[routeKey]) {
      routeMap[routeKey].count++;
    } else {
      routeMap[routeKey] = {
        startLat: trip.start_lat,
        startLon: trip.start_lon,
        endLat: trip.end_lat,
        endLon: trip.end_lon,
        count: 1,
        startStation: trip.start_station,
        endStation: trip.end_station,
      };
    }
  });

  // Get top 50 most popular routes for performance
  const popularRoutes = Object.values(routeMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  return {
    totalTrips,
    averageDuration,
    totalDistance: Math.round(totalDistance),
    tripsWithDistance,
    mostPopularStartStation,
    mostPopularEndStation,
    peakHour,
    bikeTypeBreakdown,
    passholderTypeBreakdown,
    dailyTrips,
    hourlyDistribution,
    popularRoutes,
  };
}
