/**
 * Download the Philadelphia PMTiles extract to public/philly.pmtiles.
 *
 * Runs via: npm run fetch-tiles
 * Auto-runs via: npm run build (prebuild hook, so Vercel deploys get it fresh)
 *
 * Skips if the file already exists and is >1MB (dev speed-up). Pass --force to
 * always re-extract. Requires the `pmtiles` Go CLI (`brew install pmtiles`).
 */

import { execSync } from "node:child_process";
import { existsSync, statSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, "..", "public", "philly.pmtiles");
const BBOX = "-75.35,39.85,-74.95,40.15"; // Philly + buffer, covers all Indego stations
const MAXZOOM = 14;

const FORCE = process.argv.includes("--force");

function recentBuildUrl(daysToTry = [1, 3, 7, 14, 21, 30]): string | null {
  for (const days of daysToTry) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    const yyyymmdd =
      d.getUTCFullYear() +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      String(d.getUTCDate()).padStart(2, "0");
    const url = `https://build.protomaps.com/${yyyymmdd}.pmtiles`;
    const res = execSync(`curl -s -o /dev/null -w "%{http_code}" -I -m 10 "${url}"`)
      .toString()
      .trim();
    if (res === "200") return url;
  }
  return null;
}

function main() {
  if (!FORCE && existsSync(OUT_PATH) && statSync(OUT_PATH).size > 1_000_000) {
    const sizeMB = (statSync(OUT_PATH).size / 1024 / 1024).toFixed(1);
    console.log(`philly.pmtiles already exists (${sizeMB}MB). Pass --force to re-extract.`);
    return;
  }

  const url = recentBuildUrl();
  if (!url) {
    console.error("Could not find a recent Protomaps build URL. Aborting.");
    process.exit(1);
  }

  console.log(`extracting ${BBOX} @ maxzoom=${MAXZOOM} from ${url} ...`);
  if (existsSync(OUT_PATH)) unlinkSync(OUT_PATH);

  try {
    execSync(
      `pmtiles extract "${url}" "${OUT_PATH}" --bbox=${BBOX} --maxzoom=${MAXZOOM}`,
      { stdio: "inherit" },
    );
  } catch (err) {
    console.error(
      "pmtiles CLI failed. Install via `brew install pmtiles` if missing.",
    );
    throw err;
  }

  const sizeMB = (statSync(OUT_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`wrote ${OUT_PATH} (${sizeMB}MB)`);
}

main();
