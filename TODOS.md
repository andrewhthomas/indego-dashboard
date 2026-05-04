# TODOS

Post-v1 cleanup and expansion candidates for the Indego Living Map. Captured during `/plan-eng-review` on 2026-04-22.

## Cleanup / refactors

### Consolidate station data sources

**What:** After v1 ships, unify `data/stations.json` (static snapshot used by the living map), `lib/station-mapping.ts` (runtime id → name cache used by `/trips` route tables), and runtime `fetchStationStatus()` (full live station fetch) into one canonical source.

**Why:** Three overlapping representations of station metadata is a smell. A future contributor (or you in 6 months) will ask "which one is authoritative" and there's no clear answer today.

**Pros:** Cleaner data layer. Fewer places to update when a station moves. Lower chance of divergence bugs.

**Cons:** Low-value churn until something actually breaks. Needs careful migration to avoid regressing `/trips` or `/stations`.

**Context:** `data/stations.json` was added in the v1 living-map work to give deck.gl coordinates before first paint. `lib/station-mapping.ts` predates it and is used by `components/maps/routes-table.tsx`. Runtime fetches still happen for the station map itself. The natural consolidation is: `data/stations.json` becomes the static fallback, `fetchStationStatus()` stays for real-time fields (bikesAvailable, etc.), and `station-mapping.ts` becomes a thin wrapper that reads `stations.json` synchronously.

**Depends on:** v1 ships first.

### Migrate /trips analytics to preprocessed per-day JSON

**What:** Rewrite `lib/trip-data.ts:loadTripData()` to fetch the same per-day JSON files the living map uses (joined against `stations.json` for names) instead of downloading all 4 quarter CSVs and parsing with Papa Parse client-side.

**Why:** The current `/trips` page fetches ~15-30MB of raw CSV and parses it in the browser on every load. After v1 ships, the preprocessed per-day JSON is strictly smaller and already normalized. Big perf win.

**Pros:** Faster `/trips` load. No Papa Parse dependency on the client. Smaller bundle. Cache-per-day means revisits are instant.

**Cons:** Architecturally invasive. All TripStats computation currently happens client-side; would need to split into "trips for rendering" (per-day) and "stats aggregates" (either precomputed or computed from the per-day files on demand). At least 4-8 hours of work.

**Context:** The v1 living map builds a parallel data pipeline (`scripts/preprocess-trips.ts` + `public/trips/YYYY-MM-DD.json`) for rendering. The existing `lib/trip-data.ts` pipeline serves `/trips` analytics. This TODO unifies them.

**Depends on:** v1 ships first. Per-day JSON format stable.

## Features (v1.5)

### Ghost ride mode

**What:** Click any station on the living map → that day's departures from that station animate as individual droplets moving to their destinations. Sidebar shows top 3 destinations with trip counts.

**Why:** Outside voice during `/plan-eng-review` identified this as the strongest v1.5 candidate. High "screenshot to friend" value. Turns the map from ambient art into an interactive story. Single click gives you the hyperlocal story of one station.

**Pros:** Builds on v1 data (no new data sources). deck.gl can render per-station animations with existing TripsLayer. Adds meaningful interactivity without bloating the basemap view.

**Cons:** Moderately complex state management (selected station, filtered trip set, sidebar UI). Needs thought on what happens when scrubber is playing vs. paused. Risk of clicking a quiet station and seeing nothing interesting.

**Context:** The v1 living map's `TripsLayer` already knows how to filter trips by time window and render them as trails. Ghost ride mode is a filter-by-origin-station layered on top. Sidebar is new UI. ~6-10 hours.

**Depends on:** v1 ships, audience checkpoint B returns positive signal.

## Verification tasks

### Pulse amplitude signal verification

**What:** Before implementing the station pulse layer (Day 3 Hour 15 in the current plan), sample real BTS station data for 20 minutes on a Tuesday noon, compute the 5-min EMA of capacity-ratio deltas for each station, and look at the distribution. Confirm at least 25% of stations show nonzero pulse signal.

**Why:** The pulse layer's visual appeal depends on enough stations actually having visible signal. At many stations on many hours, the delta across 5 min will be near zero (Philly averages ~0.2 bike turnover per station per minute outside commute). If only 10-15 hub stations pulse, the "breathing city" effect fails.

**Pros:** Cheap to verify (20 minutes of sampling + 15 min of analysis). Saves building the wrong thing.

**Cons:** If the signal is weak, requires a design pivot: alternatives include (a) pulse scaled to absolute bike count (bigger stations always pulse more), (b) pulse from trip arrival rate in the simulated data stream (always active during playback), (c) hybrid that blends EMA with trip-arrival signal.

**Context:** Covered in Open Questions of the design doc. This TODO exists as a reminder to actually run the 20-minute sample and act on it, not just acknowledge the risk.

**Depends on:** Start of Day 3 work (station pulse layer implementation).
