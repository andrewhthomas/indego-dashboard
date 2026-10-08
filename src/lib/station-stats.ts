import type { Station } from "./api";

export interface LiveOverview {
  bikes: number;
  classicBikes: number;
  electricBikes: number;
  smartBikes: number;
  openDocks: number;
  capacity: number;
  totalStations: number;
  activeStations: number;
  /** Bikes ÷ dock capacity, 0-100 */
  fillPercent: number;
  /** Active stations with no bikes, largest first */
  empty: Station[];
  /** Active stations with no open docks, largest first */
  full: Station[];
  /** Active stations with at most one bike or at most one open dock */
  strained: number;
}

const percent = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

export function percentOfActive(count: number, overview: LiveOverview) {
  return percent(count, overview.activeStations);
}

export function computeLiveOverview(stations: Station[]): LiveOverview {
  const active = stations.filter(
    (s) => s.kioskPublicStatus === "Active" && s.totalDocks > 0,
  );
  const sum = (pick: (s: Station) => number) =>
    stations.reduce((total, s) => total + pick(s), 0);
  const bySize = (a: Station, b: Station) => b.totalDocks - a.totalDocks;

  const bikes = sum((s) => s.bikesAvailable);
  const capacity = sum((s) => s.totalDocks);

  return {
    bikes,
    classicBikes: sum((s) => s.classicBikesAvailable),
    electricBikes: sum((s) => s.electricBikesAvailable),
    smartBikes: sum((s) => s.smartBikesAvailable),
    openDocks: sum((s) => s.docksAvailable),
    capacity,
    totalStations: stations.length,
    activeStations: active.length,
    fillPercent: percent(bikes, capacity),
    empty: active.filter((s) => s.bikesAvailable === 0).sort(bySize),
    full: active.filter((s) => s.docksAvailable === 0).sort(bySize),
    strained: active.filter(
      (s) => s.bikesAvailable <= 1 || s.docksAvailable <= 1,
    ).length,
  };
}
