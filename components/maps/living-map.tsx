"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Map } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { TripsLayer } from "deck.gl";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";
import { layers, namedFlavor } from "@protomaps/basemaps";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  loadDayTrips,
  filterInFlightAtTime,
  type LivingMapTrip,
} from "@/lib/living-map/trip-data";
import {
  loadRouteCache,
  pathForTrip,
  timestampsForPath,
  type RouteCache,
} from "@/lib/living-map/route-data";
import { Scrubber } from "./living-map-chrome";

// Register the pmtiles:// protocol once per browser session. Safe under HMR —
// maplibre.addProtocol overwrites rather than throwing.
if (typeof window !== "undefined") {
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
}

const INITIAL_VIEW_STATE = {
  longitude: -75.165,
  latitude: 39.97,
  zoom: 12.4,
  pitch: 0,
  bearing: 0,
};

const MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs:
    "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/dark",
  sources: {
    protomaps: {
      type: "vector",
      url: "pmtiles:///philly.pmtiles",
      attribution:
        '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
    },
  },
  layers: layers("protomaps", namedFlavor("dark"), { lang: "en" }),
};

// Data availability window: Q3 2025 (what preprocess-trips produced).
// Day 5+ will widen when we add Q1/Q2/Q4 preprocessing.
const MIN_DATE = "2025-07-01";
const MAX_DATE = "2025-09-30";
const DEFAULT_DATE = "2025-09-20"; // Sat, peak Q3 weekend

const MS_PER_DAY = 24 * 3_600_000;
const TRAIL_LENGTH_MS = 3 * 60_000;
const TRAIL_COLOR: [number, number, number] = [236, 72, 153];
// 1 real sec = 5 sim min = 300_000 sim ms.
// A full day (86.4M sim ms) plays in 288 sec = ~4.8 min.
const SIM_MS_PER_REAL_MS = 300;

export function LivingMap() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [currentDate, setCurrentDate] = useState(DEFAULT_DATE);
  const [currentMs, setCurrentMs] = useState(12 * 3_600_000); // noon
  const [playing, setPlaying] = useState(false);
  const [trips, setTrips] = useState<LivingMapTrip[]>([]);
  const [routes, setRoutes] = useState<RouteCache>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load the route cache once on mount. Falls back to {} on any error — map
  // then draws straight lines everywhere, which was the Day 3 behaviour.
  useEffect(() => {
    loadRouteCache().then(setRoutes);
  }, []);

  // Lazy-load per-day trips when the date changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    loadDayTrips(currentDate)
      .then((data) => {
        if (!cancelled) {
          setTrips(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(String(err));
          setTrips([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentDate]);

  // Auto-play loop. rAF drives currentMs forward at SIM_MS_PER_REAL_MS. At the
  // end of the day, wrap to midnight and keep playing ("city loops forever").
  const lastTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) {
      lastTickRef.current = null;
      return;
    }
    let raf: number;
    const tick = (now: number) => {
      const last = lastTickRef.current ?? now;
      const deltaReal = now - last;
      lastTickRef.current = now;
      setCurrentMs((prev) => {
        const next = prev + deltaReal * SIM_MS_PER_REAL_MS;
        return next >= MS_PER_DAY ? next - MS_PER_DAY : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Manual scrubber drag → pause auto-play + jump to the new time.
  const handleMsChange = useCallback((ms: number) => {
    setPlaying(false);
    setCurrentMs(ms);
  }, []);

  const handleDateChange = useCallback((iso: string) => {
    setCurrentDate(iso);
    // Don't reset currentMs — same time-of-day on a different day feels right
    // for ambient playback. User can scrub if they want a different hour.
  }, []);

  const tripsLayer = new TripsLayer<LivingMapTrip>({
    id: "trips",
    data: trips,
    getPath: (d) => pathForTrip(d, routes),
    getTimestamps: (d) => timestampsForPath(pathForTrip(d, routes), d.s, d.e),
    getColor: TRAIL_COLOR,
    opacity: 0.9,
    widthMinPixels: 1.5,
    rounded: true,
    fadeTrail: true,
    trailLength: TRAIL_LENGTH_MS,
    currentTime: currentMs,
    updateTriggers: {
      // Re-evaluate accessors when trip data OR route cache changes.
      getPath: [trips, routes],
      getTimestamps: [trips, routes],
    },
    pickable: false,
  });

  const inFlight = loadError
    ? 0
    : filterInFlightAtTime(trips, currentMs).length;
  const routedCount = Object.keys(routes).length;
  const statusText = loadError
    ? "trip load failed"
    : loading
      ? "loading…"
      : `${inFlight.toLocaleString()} in flight${routedCount > 0 ? ` · ${routedCount.toLocaleString()} routes` : ""}`;

  return (
    <div className="fixed inset-0 bg-black">
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e) =>
          setViewState(e.viewState as typeof INITIAL_VIEW_STATE)
        }
        controller={true}
        layers={[tripsLayer]}
      >
        <Map mapStyle={MAP_STYLE} reuseMaps attributionControl={false} />
      </DeckGL>
      <Scrubber
        currentDate={currentDate}
        currentMs={currentMs}
        playing={playing}
        onCurrentMsChange={handleMsChange}
        onPlayToggle={() => setPlaying((p) => !p)}
        onDateChange={handleDateChange}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
        statusText={statusText}
      />
    </div>
  );
}
