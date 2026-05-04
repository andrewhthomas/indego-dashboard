/**
 * Fetch a canonical snapshot of Indego stations → data/stations.json.
 *
 * Runs via: npm run fetch-stations
 *
 * Re-run when stations are added, moved, or renamed. The living map reads this
 * file at build time to get coordinates and names without a runtime round-trip.
 * Runtime fields (bikes available, dock status) stay in the live BTS feed via
 * lib/api.ts:fetchStationStatus() — don't commit those here.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchStationStatus } from "../lib/api";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, "..", "data", "stations.json");

type StationSnapshot = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
};

async function main() {
  console.log("fetching station status from BTS ...");
  const stations = await fetchStationStatus();
  if (stations.length === 0) {
    console.error("ERROR: BTS returned zero stations. Aborting.");
    process.exit(1);
  }

  const snapshot: StationSnapshot[] = stations
    .map((s) => ({
      id: Number(s.id),
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      capacity: s.totalDocks,
    }))
    .filter((s) => Number.isFinite(s.id) && Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .sort((a, b) => a.id - b.id);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`wrote ${snapshot.length} stations → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
