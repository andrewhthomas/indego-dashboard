// Convert Indego's station table CSV into src/data/station-names.json.
//
//   npm run build-stations -- --file=./indego-stations-2026-07-15.csv
//
// The table (from https://www.rideindego.com/about/data/) lists every station
// Indego has operated, including retired ones that still appear in trip data.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const OUT_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/station-names.json",
);

const file = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--file="))
  ?.slice("--file=".length);
if (!file) {
  console.error("Usage: npm run build-stations -- --file=<stations.csv>");
  process.exit(1);
}

const text = (await readFile(file, "utf8")).replace(/^﻿/, "");
const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

const names = {};
for (const row of data) {
  const id = row.Station_ID?.trim();
  const name = row.Station_Name?.trim();
  if (id && name) names[id] = name;
}

const sorted = Object.fromEntries(
  Object.entries(names).sort(([a], [b]) => Number(a) - Number(b)),
);
await writeFile(OUT_FILE, JSON.stringify(sorted, null, 2) + "\n");
console.log(
  `Wrote ${path.relative(process.cwd(), OUT_FILE)}: ${Object.keys(sorted).length} stations`,
);
