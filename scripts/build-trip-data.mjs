// Precompute everything the site shows about historical trips, so the browser
// never downloads raw trip CSVs.
//
//   npm run build-data                      # reads data/trips/*.csv
//   npm run build-data -- --dir=/some/dir   # reads every *.csv in that folder
//
// Inputs are Indego's quarterly trip CSVs (https://www.rideindego.com/about/data/),
// any file names. Outputs, all committed:
//
//   public/data/trips/all.json      stats for the whole history
//   public/data/trips/YYYY.json     stats for one year
//   public/data/trips/YYYY-MM.json  stats for one month
//   src/data/trip-index.json        which periods exist (drives the filters)
//   src/data/trip-patterns.json     aggregates for /patterns and the home page
//
// The files changed format over the years; normalizeRow() handles the known
// variants. Trip times are Philadelphia local time with no zone, so they are
// parsed by hand and never passed through Date's local-time handling.
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATS_DIR = path.join(ROOT, "public/data/trips");
const INDEX_FILE = path.join(ROOT, "src/data/trip-index.json");
const PATTERNS_FILE = path.join(ROOT, "src/data/trip-patterns.json");
const STATION_NAMES_FILE = path.join(ROOT, "src/data/station-names.json");
const STATION_FEED = "https://bts-status.bicycletransit.workers.dev/phl";

const AM_RUSH_HOURS = [7, 8]; // 7:00-8:59
const VIRTUAL_STATION_ID = "3000";
const PATTERN_WINDOW_MONTHS = 12;
const TOP_ROUTES = 50;
const MEMBER_TYPES = new Set(["Indego30", "Indego365"]);
const CASUAL_TYPES = new Set(["Day Pass", "Walk-up"]);

const dirArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--dir="))
  ?.slice("--dir=".length);
const inputDir = path.resolve(dirArg ?? path.join(ROOT, "data/trips"));

// ---------- parsing and normalization ----------

// "7/12/2025 15:45" or "2017-04-01 00:00:00"
function parseTime(value) {
  let y, mo, d, h, mi;
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})/.exec(value);
  if (m) {
    [, mo, d, y, h, mi] = m.map(Number);
  } else {
    m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(value);
    if (!m) return null;
    [, y, mo, d, h, mi] = m.map(Number);
  }
  const month = `${y}-${String(mo).padStart(2, "0")}`;
  const epochDay = Date.UTC(y, mo - 1, d) / 86400000;
  return {
    year: String(y),
    month,
    date: `${month}-${String(d).padStart(2, "0")}`,
    hour: h,
    dow: (new Date(Date.UTC(y, mo - 1, d)).getUTCDay() + 6) % 7, // Mon=0
    minuteOfTime: epochDay * 1440 + h * 60 + mi,
  };
}

// Files before Q2 2017 record duration in seconds; later ones in minutes.
function durationIsSeconds(rows) {
  const ratios = [];
  for (const row of rows) {
    const start = parseTime(row.start_time ?? "");
    const end = parseTime(row.end_time ?? "");
    const duration = Number(row.duration);
    if (!start || !end || !duration) continue;
    const minutes = end.minuteOfTime - start.minuteOfTime;
    if (minutes > 0) ratios.push(duration / minutes);
    if (ratios.length >= 500) break;
  }
  ratios.sort((a, b) => a - b);
  return ratios.length > 0 && ratios[Math.floor(ratios.length / 2)] > 30;
}

function normalizePass(value) {
  const type = (value ?? "").trim();
  if (type === "" || type === "NULL") return "Unknown";
  if (type === "One Day Pass" || type === "Two Day Pass") return "Day Pass";
  return type;
}

function normalizeRow(row, seconds) {
  const time = parseTime(row.start_time ?? "");
  if (!time) return null;
  const rawDuration = Number(row.duration) || 0;
  const coord = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    time,
    id: row.trip_id,
    duration: seconds ? rawDuration / 60 : rawDuration,
    // 2016 to Q1 2017 name these columns *_station_id
    start: String(row.start_station ?? row.start_station_id ?? "").trim(),
    end: String(row.end_station ?? row.end_station_id ?? "").trim(),
    startLat: coord(row.start_lat),
    startLon: coord(row.start_lon),
    endLat: coord(row.end_lat),
    endLon: coord(row.end_lon),
    bikeId: row.bike_id,
    roundTrip: row.trip_route_category === "Round Trip",
    pass: normalizePass(row.passholder_type),
    // No bike_type column before Q3 2018: the fleet was all classic bikes
    electric: row.bike_type === "electric",
  };
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const round = (n, places = 1) => Number(n.toFixed(places));
const zeros = (n) => Array.from({ length: n }, () => 0);
const bump = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
const topKey = (map) => {
  let best = "";
  let bestCount = -1;
  for (const [key, count] of map) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
};

// ---------- per-period stats (the /trips page) ----------

function newPeriod() {
  return {
    trips: 0,
    duration: 0,
    distance: 0,
    tripsWithDistance: 0,
    electric: 0,
    starts: new Map(),
    ends: new Map(),
    passes: new Map(),
    daily: new Map(),
    hourly: zeros(24),
    routes: new Map(), // start * 100000 + end -> count
  };
}

const periods = new Map(); // "all" | "2025" | "2025-06" -> period
const period = (key) => {
  let p = periods.get(key);
  if (!p) periods.set(key, (p = newPeriod()));
  return p;
};
const stationCoords = new Map(); // id -> [lat, lon], last seen

function addToPeriod(p, trip, miles) {
  p.trips++;
  p.duration += trip.duration;
  if (miles !== null) {
    p.distance += miles;
    p.tripsWithDistance++;
  }
  if (trip.electric) p.electric++;
  bump(p.starts, trip.start);
  bump(p.ends, trip.end);
  bump(p.passes, trip.pass);
  bump(p.daily, trip.time.date);
  p.hourly[trip.time.hour]++;
  if (miles !== null) {
    bump(p.routes, Number(trip.start) * 100000 + Number(trip.end));
  }
}

function finishPeriod(p) {
  const peak = p.hourly.indexOf(Math.max(...p.hourly));
  const popularRoutes = [...p.routes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_ROUTES)
    .map(([key, count]) => {
      const startStation = String(Math.floor(key / 100000));
      const endStation = String(key % 100000);
      const [startLat, startLon] = stationCoords.get(startStation);
      const [endLat, endLon] = stationCoords.get(endStation);
      return {
        startLat,
        startLon,
        endLat,
        endLon,
        count,
        startStation,
        endStation,
      };
    });

  return {
    totalTrips: p.trips,
    averageDuration: p.trips ? Math.round(p.duration / p.trips) : 0,
    totalDistance: Math.round(p.distance),
    tripsWithDistance: p.tripsWithDistance,
    mostPopularStartStation: topKey(p.starts),
    mostPopularEndStation: topKey(p.ends),
    peakHour: p.trips ? `${peak}:00-${peak + 1}:00` : "",
    bikeTypeBreakdown: { standard: p.trips - p.electric, electric: p.electric },
    passholderTypeBreakdown: Object.fromEntries(
      [...p.passes.entries()].sort((a, b) => b[1] - a[1]),
    ),
    dailyTrips: [...p.daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, trips]) => ({ date, trips })),
    hourlyDistribution: p.hourly.map((trips, hour) => ({ hour, trips })),
    popularRoutes,
  };
}

// ---------- patterns (the trailing window, plus the monthly history) ----------

function riderGroup() {
  return {
    trips: 0,
    durations: [],
    roundTrips: 0,
    electric: 0,
    weekend: 0,
    hourly: zeros(24),
  };
}

function newPatterns() {
  return {
    days: new Map(), // date -> dow
    dowHour: Array.from({ length: 7 }, () => zeros(24)),
    stations: new Map(),
    bikes: new Map(),
    riders: { members: riderGroup(), casual: riderGroup() },
    passTypes: new Map(),
    trips: 0,
    duration: 0,
    electric: 0,
  };
}

function addToPatterns(w, trip) {
  const { time } = trip;
  const isWeekend = time.dow >= 5;
  w.trips++;
  w.duration += trip.duration;
  if (trip.electric) w.electric++;
  w.days.set(time.date, time.dow);
  w.dowHour[time.dow][time.hour]++;

  const station = (id) => {
    let s = w.stations.get(id);
    if (!s) {
      s = {
        starts: 0,
        ends: 0,
        amOut: 0,
        amIn: 0,
        weekdayHourStarts: zeros(24),
      };
      w.stations.set(id, s);
    }
    return s;
  };
  const from = station(trip.start);
  const to = station(trip.end);
  from.starts++;
  to.ends++;
  if (!isWeekend) {
    from.weekdayHourStarts[time.hour]++;
    if (AM_RUSH_HOURS.includes(time.hour)) {
      from.amOut++;
      to.amIn++;
    }
  }

  let bike = w.bikes.get(trip.bikeId);
  if (!bike) {
    bike = { electric: trip.electric, trips: 0, dates: new Set() };
    w.bikes.set(trip.bikeId, bike);
  }
  bike.trips++;
  bike.dates.add(time.date);

  const isMember = MEMBER_TYPES.has(trip.pass);
  const isCasual = CASUAL_TYPES.has(trip.pass);
  if (!isMember && !isCasual) return;
  let pass = w.passTypes.get(trip.pass);
  if (!pass) w.passTypes.set(trip.pass, (pass = riderGroup()));
  for (const g of [isMember ? w.riders.members : w.riders.casual, pass]) {
    g.trips++;
    g.durations.push(Math.round(trip.duration));
    if (trip.roundTrip) g.roundTrips++;
    if (trip.electric) g.electric++;
    if (isWeekend) g.weekend++;
    g.hourly[time.hour]++;
  }
}

function summarizeRiders(g) {
  const sorted = g.durations.slice().sort((a, b) => a - b);
  return {
    trips: g.trips,
    medianDuration: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
    roundTripShare: round((g.roundTrips / g.trips) * 100),
    electricShare: round((g.electric / g.trips) * 100),
    weekendShare: round((g.weekend / g.trips) * 100),
    hourlyShare: g.hourly.map((n) => round((n / g.trips) * 100, 2)),
  };
}

function finishPatterns(w, nameOf) {
  const dates = [...w.days.keys()].sort();
  const dowDays = zeros(7);
  for (const dow of w.days.values()) dowDays[dow]++;
  const weekdayDays = dowDays.slice(0, 5).reduce((a, b) => a + b, 0);
  const weekendDays = dowDays[5] + dowDays[6];
  const hourlyTotals = (dows) =>
    zeros(24).map((_, h) => dows.reduce((sum, d) => sum + w.dowHour[d][h], 0));
  const allHourly = hourlyTotals([0, 1, 2, 3, 4, 5, 6]);

  // 3000 is Indego's virtual station (remote check-ins), not a place.
  const stationList = [...w.stations.entries()]
    .filter(([id]) => id !== VIRTUAL_STATION_ID)
    .map(([id, s]) => ({ id, ...s }));
  const commuter = stationList
    .map((s) => ({
      id: s.id,
      name: nameOf(s.id),
      departures: round(s.amOut / weekdayDays),
      arrivals: round(s.amIn / weekdayDays),
      net: round((s.amIn - s.amOut) / weekdayDays),
    }))
    .sort((a, b) => a.net - b.net);

  const bikeList = [...w.bikes.entries()].map(([id, b]) => ({
    id,
    ...b,
    activeDays: b.dates.size,
  }));
  const fleet = (electric) => {
    const list = bikeList.filter((b) => b.electric === electric);
    const trips = list.reduce((sum, b) => sum + b.trips, 0);
    const activeDays = list.reduce((sum, b) => sum + b.activeDays, 0);
    return {
      bikes: list.length,
      trips,
      tripsPerActiveDay: round(trips / activeDays, 2),
    };
  };

  return {
    window: {
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      days: dates.length,
      trips: w.trips,
      avgDuration: Math.round(w.duration / w.trips),
      electricShare: Math.round((w.electric / w.trips) * 100),
      avgTripsPerDay: Math.round(w.trips / dates.length),
      peakHour: allHourly.indexOf(Math.max(...allHourly)),
    },
    hourly: {
      weekday: hourlyTotals([0, 1, 2, 3, 4]).map((n) => round(n / weekdayDays)),
      weekend: hourlyTotals([5, 6]).map((n) => round(n / weekendDays)),
    },
    // Rows Monday..Sunday, columns hour 0..23: average trips started in that hour
    dowHour: w.dowHour.map((row, d) => row.map((n) => round(n / dowDays[d]))),
    commuter: {
      exporters: commuter.slice(0, 10),
      importers: commuter.slice(-10).reverse(),
    },
    busiestStations: stationList
      .sort((a, b) => b.starts + b.ends - (a.starts + a.ends))
      .slice(0, 15)
      .map((s) => ({
        id: s.id,
        name: nameOf(s.id),
        starts: round(s.starts / dates.length),
        ends: round(s.ends / dates.length),
        // Average weekday trips started per hour
        weekdayHourly: s.weekdayHourStarts.map((n) => round(n / weekdayDays)),
      })),
    riders: {
      members: summarizeRiders(w.riders.members),
      casual: summarizeRiders(w.riders.casual),
      passTypes: [...w.passTypes.entries()]
        .map(([type, g]) => {
          const { hourlyShare: _hourlyShare, ...rest } = summarizeRiders(g);
          return { type, ...rest };
        })
        .sort((a, b) => b.trips - a.trips),
    },
    bikes: {
      electric: fleet(true),
      standard: fleet(false),
      top: bikeList
        .sort((a, b) => b.trips - a.trips)
        .slice(0, 10)
        .map((b) => ({
          id: b.id,
          type: b.electric ? "electric" : "standard",
          trips: b.trips,
          activeDays: b.activeDays,
        })),
    },
  };
}

// Roster first (it includes retired stations), then the live feed for any
// station too new to be in the roster.
async function stationNames() {
  const names = new Map(
    Object.entries(JSON.parse(await readFile(STATION_NAMES_FILE, "utf8"))),
  );
  try {
    const res = await fetch(STATION_FEED);
    const data = await res.json();
    for (const f of data.features) {
      const id = String(f.properties.id);
      if (!names.has(id)) names.set(id, f.properties.name);
    }
  } catch (error) {
    console.warn("Could not load live station names:", error.message);
  }
  return names;
}

// ---------- pass 1: read every file ----------

const files = (await readdir(inputDir))
  .filter(
    (name) => name.toLowerCase().endsWith(".csv") && !/station/i.test(name),
  )
  .sort();
if (files.length === 0) {
  console.error(`No trip CSVs found in ${inputDir}`);
  process.exit(1);
}

// The patterns window is the last PATTERN_WINDOW_MONTHS months of data, so the
// newest month has to be known before aggregating. Trips are kept in memory
// per file only; the window is resolved from a cheap first scan of months.
const monthsSeen = new Set();
const parsedFiles = [];
let skipped = 0;
let duplicates = 0;
let previousIds = new Set();

for (const file of files) {
  const text = (await readFile(path.join(inputDir, file), "utf8")).replace(
    /^﻿/,
    "",
  );
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  const seconds = durationIsSeconds(data);
  const ids = new Set();
  const trips = [];
  for (const row of data) {
    const trip = normalizeRow(row, seconds);
    if (!trip || !trip.start || !trip.end) {
      skipped++;
      continue;
    }
    // Adjacent quarterly files occasionally repeat trips at the boundary.
    if (previousIds.has(trip.id) || ids.has(trip.id)) {
      duplicates++;
      continue;
    }
    ids.add(trip.id);
    monthsSeen.add(trip.time.month);
    trips.push(trip);
  }
  previousIds = ids;
  parsedFiles.push({ file, trips, seconds });
  console.log(
    `${file}: ${trips.length.toLocaleString()} trips${seconds ? " (duration in seconds, converted)" : ""}`,
  );
}

const allMonths = [...monthsSeen].sort();
const windowMonths = new Set(allMonths.slice(-PATTERN_WINDOW_MONTHS));

// ---------- pass 2: aggregate ----------

const patterns = newPatterns();
const monthly = new Map(); // month -> { electric, standard, dates:Set }
const dayTotals = new Map(); // date -> trips, all time

for (const { trips } of parsedFiles) {
  for (const trip of trips) {
    const hasCoords =
      trip.startLat && trip.startLon && trip.endLat && trip.endLon;
    const miles = hasCoords
      ? haversineMiles(trip.startLat, trip.startLon, trip.endLat, trip.endLon)
      : null;
    if (trip.startLat && trip.startLon)
      stationCoords.set(trip.start, [trip.startLat, trip.startLon]);
    if (trip.endLat && trip.endLon)
      stationCoords.set(trip.end, [trip.endLat, trip.endLon]);

    addToPeriod(period("all"), trip, miles);
    addToPeriod(period(trip.time.year), trip, miles);
    addToPeriod(period(trip.time.month), trip, miles);

    let m = monthly.get(trip.time.month);
    if (!m)
      monthly.set(
        trip.time.month,
        (m = { electric: 0, standard: 0, dates: new Set() }),
      );
    m[trip.electric ? "electric" : "standard"]++;
    m.dates.add(trip.time.date);
    bump(dayTotals, trip.time.date);

    if (windowMonths.has(trip.time.month)) addToPatterns(patterns, trip);
  }
}

// ---------- write ----------

const names = await stationNames();
const nameOf = (id) => names.get(id) ?? `Station ${id}`;

await rm(STATS_DIR, { recursive: true, force: true });
await mkdir(STATS_DIR, { recursive: true });
const index = [];
for (const [key, p] of [...periods.entries()].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  await writeFile(
    path.join(STATS_DIR, `${key}.json`),
    JSON.stringify(finishPeriod(p)),
  );
  index.push({ key, trips: p.trips });
}

const all = periods.get("all");
const dates = [...dayTotals.keys()].sort();
const busiestDay = dates.reduce((best, d) =>
  dayTotals.get(d) > dayTotals.get(best) ? d : best,
);
const years = [...new Set(allMonths.map((m) => m.slice(0, 4)))];

await writeFile(
  INDEX_FILE,
  JSON.stringify(
    {
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      totalTrips: all.trips,
      years: years.map((year) => ({
        year,
        trips: periods.get(year).trips,
        months: allMonths.filter((m) => m.startsWith(year)),
      })),
    },
    null,
    2,
  ) + "\n",
);

await writeFile(
  PATTERNS_FILE,
  JSON.stringify(
    {
      meta: {
        totalTrips: all.trips,
        firstDate: dates[0],
        lastDate: dates[dates.length - 1],
        days: dates.length,
        busiestDay: { date: busiestDay, trips: dayTotals.get(busiestDay) },
      },
      // Average trips per day for every month in the data
      monthly: [...monthly.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, m]) => ({
          month,
          electric: Math.round(m.electric / m.dates.size),
          standard: Math.round(m.standard / m.dates.size),
        })),
      yearly: years.map((year) => ({ year, trips: periods.get(year).trips })),
      ...finishPatterns(patterns, nameOf),
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `\n${all.trips.toLocaleString()} trips, ${dates[0]} to ${dates[dates.length - 1]}, from ${files.length} files`,
);
console.log(
  `Skipped ${skipped} unparseable rows and ${duplicates} duplicate trips`,
);
console.log(
  `Wrote ${index.length} period files to ${path.relative(ROOT, STATS_DIR)}`,
);
