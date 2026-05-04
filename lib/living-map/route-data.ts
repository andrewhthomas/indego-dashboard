import { stationMap, type LivingMapTrip } from "./trip-data";

/**
 * Map from "fromStationId-toStationId" to a cached street-routed polyline.
 * Generated offline by scripts/route-pairs.ts via OpenRouteService, served from
 * /public/routes.json. Entries missing from the map fall back to straight lines.
 */
export type RouteCache = Record<string, [number, number][]>;

export function pairKey(f: number, t: number): string {
  return `${f}-${t}`;
}

/**
 * Fetch the routed-path cache. Returns `{}` on any failure — callers should
 * then fall back to straight lines everywhere (which is what the map did in
 * Day 3 anyway).
 */
export async function loadRouteCache(): Promise<RouteCache> {
  try {
    const res = await fetch("/routes.json");
    if (!res.ok) return {};
    return (await res.json()) as RouteCache;
  } catch {
    return {};
  }
}

/**
 * Return the path (polyline) for a given trip. Uses the routed polyline if the
 * pair is cached; otherwise returns a 2-point straight line between stations.
 * Returns [] if either station is unknown (preprocess-trips should have
 * filtered these, but guard anyway).
 */
export function pathForTrip(
  trip: LivingMapTrip,
  routes: RouteCache,
): [number, number][] {
  const cached = routes[pairKey(trip.f, trip.t)];
  if (cached && cached.length >= 2) return cached;

  const from = stationMap.get(trip.f);
  const to = stationMap.get(trip.t);
  if (!from || !to) return [];
  return [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ];
}

/**
 * Interpolate timestamps for each vertex of a polyline, proportional to
 * euclidean distance along the path. TripsLayer needs one timestamp per vertex;
 * without this the layer would put the whole trip at `trip.s`, breaking the
 * leading-edge-moves-along-route effect.
 */
export function timestampsForPath(
  path: [number, number][],
  s: number,
  e: number,
): number[] {
  const n = path.length;
  if (n < 2) return path.length === 1 ? [s] : [];
  if (n === 2) return [s, e];

  // Cumulative euclidean distance (close enough at city scale; we only need
  // proportions, not absolute meters).
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < n; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return new Array(n).fill(s);

  const timestamps = [s];
  let cumul = 0;
  for (let i = 0; i < segLens.length; i++) {
    cumul += segLens[i];
    timestamps.push(s + (cumul / total) * (e - s));
  }
  return timestamps;
}
