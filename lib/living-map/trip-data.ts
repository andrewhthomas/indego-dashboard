import stationsData from "@/data/stations.json";

export type LivingMapTrip = {
  /** ms since midnight of the trip's date (can exceed 86.4M if crossing midnight) */
  s: number;
  e: number;
  /** from station id */
  f: number;
  /** to station id */
  t: number;
};

export type StationSnapshot = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
};

export const stations: StationSnapshot[] = stationsData as StationSnapshot[];

/** id → StationSnapshot lookup, built once at module load. */
export const stationMap = new Map<number, StationSnapshot>(
  stations.map((s) => [s.id, s]),
);

/**
 * Fetch the preprocessed trip JSON for one ISO date (YYYY-MM-DD).
 * These files are generated offline by `scripts/preprocess-trips.ts`.
 */
export async function loadDayTrips(isoDate: string): Promise<LivingMapTrip[]> {
  const res = await fetch(`/trips/${isoDate}.json`);
  if (!res.ok) {
    throw new Error(
      `Failed to load trips for ${isoDate}: HTTP ${res.status}`,
    );
  }
  return res.json();
}

/**
 * Pure function: trips currently riding at scrubber time `currentMs`.
 * NOT used by TripsLayer (it filters on GPU via trailLength); used by the
 * accessibility summary and the in-flight count readout.
 */
export function filterInFlightAtTime(
  trips: LivingMapTrip[],
  currentMs: number,
): LivingMapTrip[] {
  return trips.filter((t) => t.s <= currentMs && t.e > currentMs);
}
