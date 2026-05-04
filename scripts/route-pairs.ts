/**
 * Route the top-N most-traveled origin/destination station pairs via
 * OpenRouteService's cycling-regular profile. Cache polylines as
 * public/routes.json keyed by "fromId-toId".
 *
 * Runs via: npm run route-pairs [-- --top-n=N]
 * Resumable: re-running picks up where it left off (existing cache entries are
 *            skipped). Incrementally saves every 50 new routes.
 *
 * Env: OPENROUTESERVICE_API_KEY in .env.local (sign up at
 *      https://openrouteservice.org/dev/#/signup — free tier is 2000 req/day).
 * Rate: sequential with 1500ms sleep → 40 req/min (under ORS's 40/min limit).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TRIPS_DIR = resolve(HERE, "..", "public", "trips");
const STATIONS_PATH = resolve(HERE, "..", "data", "stations.json");
const OUT_PATH = resolve(HERE, "..", "public", "routes.json");
const ENV_PATH = resolve(HERE, "..", ".env.local");

const DEFAULT_TOP_N = 2000;
const ORS_ENDPOINT =
  "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson";
const SLEEP_MS = 1500; // 40 req/min
const BACKOFF_ON_429_MS = 60_000;
// Node's fetch has no default timeout — hung connections can block for hours.
// Abort any request that hasn't responded in 15s so we move on.
const FETCH_TIMEOUT_MS = 15_000;

// Inline .env.local loader — avoids dotenv dep. Reads KEY=VALUE lines.
function loadDotenv(path: string) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf-8").split("\n")) {
    const m = raw.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

type Station = { id: number; lat: number; lng: number; name: string };
type PairCount = { f: number; t: number; count: number };
type RouteCache = Record<string, [number, number][]>;
type RouteResult = [number, number][] | "RATE_LIMIT" | "NO_ROUTE" | "FATAL";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tryRoute(
  from: Station,
  to: Station,
  apiKey: string,
): Promise<RouteResult> {
  const body = JSON.stringify({
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(ORS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/geo+json; charset=utf-8",
      },
      body,
      signal: controller.signal,
    });
    if (res.status === 429) return "RATE_LIMIT";
    if (res.status === 401 || res.status === 403) {
      console.error(`ORS auth error (${res.status}): ${await res.text()}`);
      return "FATAL";
    }
    if (!res.ok) {
      const text = await res.text();
      console.log(`  [skip ${res.status}] ${text.slice(0, 120)}`);
      return "NO_ROUTE";
    }
    const data = (await res.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) return "NO_ROUTE";
    return coords;
  } catch (err) {
    const isTimeout = (err as Error).name === "AbortError";
    console.log(
      `  [skip] ${isTimeout ? `timeout >${FETCH_TIMEOUT_MS}ms` : `network error: ${err}`}`,
    );
    return "NO_ROUTE";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  loadDotenv(ENV_PATH);
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENROUTESERVICE_API_KEY.");
    console.error("  1. Sign up at https://openrouteservice.org/dev/#/signup");
    console.error("  2. Copy your API key from the dashboard");
    console.error("  3. Add to .env.local: OPENROUTESERVICE_API_KEY=<key>");
    process.exit(1);
  }

  const topNArg = process.argv.find((a) => a.startsWith("--top-n="));
  const topN = topNArg ? Number(topNArg.split("=")[1]) : DEFAULT_TOP_N;

  const stations = JSON.parse(readFileSync(STATIONS_PATH, "utf-8")) as Station[];
  const stationMap = new Map(stations.map((s) => [s.id, s]));

  console.log("aggregating pairs from public/trips/ ...");
  const tripFiles = readdirSync(TRIPS_DIR).filter((f) => f.endsWith(".json"));
  const pairCounts = new Map<string, PairCount>();
  for (const file of tripFiles) {
    const trips = JSON.parse(
      readFileSync(resolve(TRIPS_DIR, file), "utf-8"),
    ) as Array<{ f: number; t: number }>;
    for (const trip of trips) {
      if (trip.f === trip.t) continue; // same-station loops
      const key = `${trip.f}-${trip.t}`;
      const entry = pairCounts.get(key);
      if (entry) entry.count++;
      else pairCounts.set(key, { f: trip.f, t: trip.t, count: 1 });
    }
  }
  console.log(`  ${pairCounts.size.toLocaleString()} unique directional pairs`);

  const sorted = Array.from(pairCounts.values()).sort(
    (a, b) => b.count - a.count,
  );
  const target = sorted.slice(0, topN);
  const totalTrips = sorted.reduce((s, p) => s + p.count, 0);
  const coveredTrips = target.reduce((s, p) => s + p.count, 0);
  console.log(
    `  top ${target.length.toLocaleString()} pairs cover ${coveredTrips.toLocaleString()} / ${totalTrips.toLocaleString()} trips (${((coveredTrips / totalTrips) * 100).toFixed(1)}%)`,
  );

  // Resume from existing cache if present
  let cache: RouteCache = {};
  if (existsSync(OUT_PATH)) {
    cache = JSON.parse(readFileSync(OUT_PATH, "utf-8")) as RouteCache;
    console.log(
      `  resuming with ${Object.keys(cache).length.toLocaleString()} existing entries`,
    );
  }

  const save = () => writeFileSync(OUT_PATH, JSON.stringify(cache));

  let routed = 0;
  let skipped = 0;
  let failed = 0;
  for (let i = 0; i < target.length; i++) {
    const pair = target[i];
    const key = `${pair.f}-${pair.t}`;
    if (cache[key]) {
      skipped++;
      continue;
    }
    const from = stationMap.get(pair.f);
    const to = stationMap.get(pair.t);
    if (!from || !to) {
      failed++;
      continue;
    }

    const result = await tryRoute(from, to, apiKey);
    if (result === "FATAL") {
      console.error("fatal error; saving progress and stopping");
      break;
    }
    if (result === "RATE_LIMIT") {
      console.log(`  rate-limited — sleeping ${BACKOFF_ON_429_MS / 1000}s`);
      save();
      await sleep(BACKOFF_ON_429_MS);
      i--; // retry this pair
      continue;
    }
    if (result === "NO_ROUTE") {
      failed++;
      continue;
    }

    cache[key] = result;
    routed++;

    if (routed % 50 === 0) {
      save();
      console.log(
        `  [${i + 1}/${target.length}] ${from.name} → ${to.name} (${pair.count} trips) · saved ${routed} new`,
      );
    }
    await sleep(SLEEP_MS);
  }

  save();
  const sizeKB = (JSON.stringify(cache).length / 1024).toFixed(0);
  console.log(
    `\ndone. routed ${routed} new, skipped ${skipped} (already cached), failed ${failed}`,
  );
  console.log(
    `wrote ${OUT_PATH} (${Object.keys(cache).length.toLocaleString()} total routes, ~${sizeKB}KB)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
