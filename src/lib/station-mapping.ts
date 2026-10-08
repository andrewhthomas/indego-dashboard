import { fetchStationStatus } from "./api";
import { hasStationName, stationName } from "./station-names";

export interface StationMapping {
  [stationId: string]: string;
}

let stationMappingCache: StationMapping | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getStationMapping(): Promise<StationMapping> {
  const now = Date.now();

  // Return cached mapping if it's still fresh
  if (stationMappingCache && now - cacheTimestamp < CACHE_DURATION) {
    return stationMappingCache;
  }

  try {
    const stations = await fetchStationStatus();
    const mapping: StationMapping = {};

    stations.forEach((station) => {
      mapping[station.id] = station.name;
    });

    stationMappingCache = mapping;
    cacheTimestamp = now;

    return mapping;
  } catch (error) {
    console.error("Error fetching station mapping:", error);

    // Return empty mapping on error, falling back to the station roster
    return {};
  }
}

export function getStationName(
  stationId: string,
  mapping: StationMapping,
): string {
  // Trip data is historical, so prefer the roster: a few station IDs have
  // since been reused for a different location in the live feed. Fall back to
  // live names for stations newer than the roster.
  if (hasStationName(stationId)) return stationName(stationId);
  return mapping[stationId] || stationName(stationId);
}
