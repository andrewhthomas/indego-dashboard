import tripIndex from "@/data/trip-index.json";

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

// Which periods have precomputed stats. Generated, with the stats themselves,
// by scripts/build-trip-data.mjs.
export const TRIP_INDEX = tripIndex;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2025-06" -> "June 2025", or "Jun 2025" when short */
export function formatMonthKey(key: string, short = false): string {
  const [year, month] = key.split("-");
  const name = MONTH_NAMES[Number(month) - 1];
  return `${short ? name.slice(0, 3) : name} ${year}`;
}

/** e.g. "Jan 2016 to Jun 2026" */
export const DATA_RANGE_LABEL = `${formatMonthKey(TRIP_INDEX.firstDate.slice(0, 7), true)} to ${formatMonthKey(TRIP_INDEX.lastDate.slice(0, 7), true)}`;

/** Label for a period key: "all", "2025" or "2025-06" */
export function formatPeriod(key: string): string {
  if (key === "all") return DATA_RANGE_LABEL;
  return key.includes("-") ? formatMonthKey(key) : key;
}

/**
 * Precomputed stats for one period: "all", a year ("2025") or a month
 * ("2025-06"). Each is a small static JSON file.
 */
export async function loadTripStats(period: string): Promise<TripStats> {
  const response = await fetch(`/data/trips/${period}.json`);
  if (!response.ok) {
    throw new Error(`No trip data for ${formatPeriod(period)}`);
  }
  return response.json();
}
