/**
 * Preprocess a quarter's trip CSV into per-day JSON files for the living map.
 *
 * Runs via: npm run preprocess-trips -- --quarter=q3
 *
 * Input:  ${BLOB_BASE_URL}/indego-trips-2025-q{N}.csv
 *         (15 columns per row; see lib/trip-data.ts:TripRecord for the full shape)
 * Output: public/trips/YYYY-MM-DD.json  (one file per calendar day)
 *         Each file is a LivingMapTrip[] with shape {s, e, f, t}.
 *
 * Validation rules:
 *   - drop rows with unparsable times
 *   - drop rows whose start OR end station id isn't in data/stations.json
 *   - trips that span midnight get attributed to their START date; end can be >86.4M
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import { BLOB_BASE_URL } from "../lib/constants";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATIONS_PATH = resolve(HERE, "..", "data", "stations.json");
const OUT_DIR = resolve(HERE, "..", "public", "trips");

export type LivingMapTrip = {
  s: number; // ms since midnight of the trip's date (can exceed 86.4M if crossing midnight)
  e: number;
  f: number; // from station id
  t: number; // to station id
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parse Indego's "M/D/YYYY H:MM" timestamp format into a JS Date (local time).
 * Returns null for unparsable input.
 */
export function parseIndegoTimestamp(raw: string): Date | null {
  const m = raw
    ?.trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, mo, day, year, hh, mm] = m;
  const d = new Date(
    Number(year),
    Number(mo) - 1,
    Number(day),
    Number(hh),
    Number(mm),
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Ms elapsed since the start of `date`'s local day.
 * Example: 2025-09-20 12:34 → 45,240,000 (12h 34m in ms).
 */
export function millisSinceMidnight(date: Date): number {
  return (
    date.getHours() * 3_600_000 +
    date.getMinutes() * 60_000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds()
  );
}

function isoDate(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

type RawTripRow = {
  start_time: string;
  end_time: string;
  start_station: string;
  end_station: string;
};

/**
 * Transform one parsed CSV row into a LivingMapTrip. Returns null if the row
 * fails any validation rule (unparsable times, unknown station, reversed times).
 */
export function rowToTrip(
  row: RawTripRow,
  validStationIds: Set<number>,
): { trip: LivingMapTrip; dateKey: string } | null {
  const start = parseIndegoTimestamp(row.start_time);
  const end = parseIndegoTimestamp(row.end_time);
  if (!start || !end || end.getTime() <= start.getTime()) return null;

  const f = Number(row.start_station);
  const t = Number(row.end_station);
  if (!Number.isFinite(f) || !Number.isFinite(t)) return null;
  if (!validStationIds.has(f) || !validStationIds.has(t)) return null;

  const startDateKey = isoDate(start);
  const s = millisSinceMidnight(start);

  // If trip crosses midnight, record e as ms since the START date's midnight
  // so TripsLayer's currentTime comparison stays monotonic.
  const dayDelta = Math.floor(
    (end.getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) /
      MS_PER_DAY,
  );
  const e = millisSinceMidnight(end) + dayDelta * MS_PER_DAY;

  return { trip: { s, e, f, t }, dateKey: startDateKey };
}

/**
 * Parse the full CSV and group trips by their START date (YYYY-MM-DD). Pure.
 * Exported for unit tests.
 */
export function parseTripsIntoDateMap(
  csv: string,
  validStationIds: Set<number>,
): Map<string, LivingMapTrip[]> {
  const result = Papa.parse<RawTripRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  const byDate = new Map<string, LivingMapTrip[]>();
  let dropped = 0;
  for (const row of result.data) {
    const parsed = rowToTrip(row, validStationIds);
    if (!parsed) {
      dropped++;
      continue;
    }
    const bucket = byDate.get(parsed.dateKey);
    if (bucket) bucket.push(parsed.trip);
    else byDate.set(parsed.dateKey, [parsed.trip]);
  }
  if (dropped > 0) console.log(`  dropped ${dropped} invalid rows`);
  return byDate;
}

// -------- Main (runs when invoked directly, skipped when imported by tests) --------

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--quarter="));
  const quarter = arg?.split("=")[1]?.toLowerCase() || "q3";
  if (!/^q[1-4]$/.test(quarter)) {
    console.error("--quarter must be q1 | q2 | q3 | q4");
    process.exit(1);
  }

  console.log("loading station IDs from data/stations.json ...");
  const stations = JSON.parse(readFileSync(STATIONS_PATH, "utf-8")) as Array<{
    id: number;
  }>;
  const stationIds = new Set(stations.map((s) => s.id));
  console.log(`  ${stationIds.size} stations`);

  const url = `${BLOB_BASE_URL}/indego-trips-2025-${quarter}.csv`;
  console.log(`fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`HTTP ${res.status} on ${url}`);
    process.exit(1);
  }
  const csv = await res.text();
  console.log(`  ${(csv.length / 1024 / 1024).toFixed(1)}MB raw CSV`);

  console.log("parsing + grouping by date ...");
  const byDate = parseTripsIntoDateMap(csv, stationIds);
  console.log(`  ${byDate.size} unique dates`);

  mkdirSync(OUT_DIR, { recursive: true });
  let totalTrips = 0;
  for (const [dateKey, trips] of byDate) {
    trips.sort((a, b) => a.s - b.s);
    writeFileSync(
      resolve(OUT_DIR, `${dateKey}.json`),
      JSON.stringify(trips), // no pretty-print — saves ~20% size
    );
    totalTrips += trips.length;
  }
  console.log(`wrote ${totalTrips} trips across ${byDate.size} files → ${OUT_DIR}`);
}

// Only run main() when invoked directly (not when imported by tests).
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
