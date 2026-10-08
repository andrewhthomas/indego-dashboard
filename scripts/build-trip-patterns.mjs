// Precompute the aggregates behind /patterns and the home page trip insights.
//
//   npm run build-patterns                    # reads the CSVs from the deployed site
//   npm run build-patterns -- --dir=./csv     # reads local indego-trips-2025-q*.csv
//   npm run build-patterns -- --base=http://localhost:4321/api/trips
//
// Writes src/data/trip-patterns.json, which is committed. Re-run when a quarter
// is added. Trip times in the CSVs are Philadelphia local time with no zone, so
// they are parsed by hand and never passed through Date's local-time handling.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const QUARTER_FILES = [
  "indego-trips-2025-q1.csv",
  "indego-trips-2025-q2.csv",
  "indego-trips-2025-q3.csv",
  "indego-trips-2025-q4.csv",
];
const DEFAULT_BASE =
  "https://indego-dashboard.andrewhthomas.workers.dev/api/trips";
const STATION_FEED = "https://bts-status.bicycletransit.workers.dev/phl";
const OUT_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/trip-patterns.json",
);

const AM_RUSH_HOURS = [7, 8]; // 7:00-8:59
const VIRTUAL_STATION_ID = "3000";
const MEMBER_TYPES = new Set(["Indego30", "Indego365"]);
const CASUAL_TYPES = new Set(["Day Pass", "Walk-up"]);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

async function readCsv(file) {
  if (args.dir) return readFile(path.join(args.dir, file), "utf8");
  const res = await fetch(`${args.base ?? DEFAULT_BASE}/${file}`);
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
  return res.text();
}

async function stationNames() {
  try {
    const res = await fetch(STATION_FEED);
    const data = await res.json();
    return new Map(
      data.features.map((f) => [String(f.properties.id), f.properties.name]),
    );
  } catch (error) {
    console.warn("Could not load station names:", error.message);
    return new Map();
  }
}

// "7/12/2025 15:45" -> { date: "2025-07-12", month: "2025-07", hour: 15, dow: 0..6 (Mon=0) }
function parseTime(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, mo, d, y, h] = m.map(Number);
  const month = `${y}-${String(mo).padStart(2, "0")}`;
  const jsDow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // Sun=0
  return {
    date: `${month}-${String(d).padStart(2, "0")}`,
    month,
    hour: h,
    dow: (jsDow + 6) % 7,
  };
}

const round = (n, places = 1) => Number(n.toFixed(places));
const zeros = (n) => Array.from({ length: n }, () => 0);
const median = (sorted) =>
  sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)];

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

const days = new Map(); // date -> { dow, trips }
const dowHour = Array.from({ length: 7 }, () => zeros(24));
const months = new Map(); // month -> { electric, standard, dates:Set }
const stations = new Map(); // id -> { starts, ends, amOut, amIn, weekdayHourStarts[24] }
const bikes = new Map(); // id -> { type, trips, dates:Set }
const riders = { members: riderGroup(), casual: riderGroup() };
const passTypes = new Map(); // type -> riderGroup
let totalTrips = 0;
let totalDuration = 0;
let electricTrips = 0;
let skipped = 0;

const station = (id) => {
  let s = stations.get(id);
  if (!s) {
    s = { starts: 0, ends: 0, amOut: 0, amIn: 0, weekdayHourStarts: zeros(24) };
    stations.set(id, s);
  }
  return s;
};

for (const file of QUARTER_FILES) {
  console.log(`Reading ${file}...`);
  const { data } = Papa.parse(await readCsv(file), {
    header: true,
    skipEmptyLines: true,
  });
  for (const row of data) {
    const t = parseTime(row.start_time);
    if (!t) {
      skipped++;
      continue;
    }
    const duration = Number(row.duration) || 0;
    const isWeekend = t.dow >= 5;
    const isElectric = row.bike_type === "electric";
    totalTrips++;
    totalDuration += duration;
    if (isElectric) electricTrips++;

    const day = days.get(t.date) ?? { dow: t.dow, trips: 0 };
    day.trips++;
    days.set(t.date, day);
    dowHour[t.dow][t.hour]++;

    const month = months.get(t.month) ?? {
      electric: 0,
      standard: 0,
      dates: new Set(),
    };
    month[isElectric ? "electric" : "standard"]++;
    month.dates.add(t.date);
    months.set(t.month, month);

    const from = station(row.start_station);
    const to = station(row.end_station);
    from.starts++;
    to.ends++;
    if (!isWeekend) {
      from.weekdayHourStarts[t.hour]++;
      if (AM_RUSH_HOURS.includes(t.hour)) {
        from.amOut++;
        to.amIn++;
      }
    }

    const bike = bikes.get(row.bike_id) ?? {
      type: row.bike_type,
      trips: 0,
      dates: new Set(),
    };
    bike.trips++;
    bike.dates.add(t.date);
    bikes.set(row.bike_id, bike);

    const groups = [];
    if (MEMBER_TYPES.has(row.passholder_type)) groups.push(riders.members);
    if (CASUAL_TYPES.has(row.passholder_type)) groups.push(riders.casual);
    if (
      MEMBER_TYPES.has(row.passholder_type) ||
      CASUAL_TYPES.has(row.passholder_type)
    ) {
      let pass = passTypes.get(row.passholder_type);
      if (!pass) passTypes.set(row.passholder_type, (pass = riderGroup()));
      groups.push(pass);
    }
    for (const g of groups) {
      g.trips++;
      g.durations.push(duration);
      if (row.trip_route_category === "Round Trip") g.roundTrips++;
      if (isElectric) g.electric++;
      if (isWeekend) g.weekend++;
      g.hourly[t.hour]++;
    }
  }
}

const names = await stationNames();
const nameOf = (id) => names.get(id) ?? `Station ${id}`;

const dates = [...days.keys()].sort();
const dayCount = dates.length;
const dowDays = zeros(7);
for (const d of days.values()) dowDays[d.dow]++;
const weekdayDays = dowDays.slice(0, 5).reduce((a, b) => a + b, 0);
const weekendDays = dowDays[5] + dowDays[6];

const hourlyTotals = (dows) =>
  zeros(24).map((_, h) => dows.reduce((sum, d) => sum + dowHour[d][h], 0));
const weekdayHourly = hourlyTotals([0, 1, 2, 3, 4]).map((n) =>
  round(n / weekdayDays),
);
const weekendHourly = hourlyTotals([5, 6]).map((n) => round(n / weekendDays));
const allHourly = hourlyTotals([0, 1, 2, 3, 4, 5, 6]);
const peakHour = allHourly.indexOf(Math.max(...allHourly));
const busiestDay = dates.reduce((best, d) =>
  days.get(d).trips > days.get(best).trips ? d : best,
);

// 3000 is Indego's virtual station (remote check-ins), not a place.
const stationList = [...stations.entries()]
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

const summarize = (g) => {
  const sorted = g.durations.slice().sort((a, b) => a - b);
  return {
    trips: g.trips,
    medianDuration: median(sorted),
    roundTripShare: round((g.roundTrips / g.trips) * 100),
    electricShare: round((g.electric / g.trips) * 100),
    weekendShare: round((g.weekend / g.trips) * 100),
    hourlyShare: g.hourly.map((n) => round((n / g.trips) * 100, 2)),
  };
};

const bikeList = [...bikes.entries()].map(([id, b]) => ({
  id,
  ...b,
  activeDays: b.dates.size,
}));
const fleet = (type) => {
  const list = bikeList.filter((b) => b.type === type);
  const trips = list.reduce((sum, b) => sum + b.trips, 0);
  const activeDays = list.reduce((sum, b) => sum + b.activeDays, 0);
  return {
    bikes: list.length,
    trips,
    tripsPerActiveDay: round(trips / activeDays, 2),
  };
};

const output = {
  meta: {
    totalTrips,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
    days: dayCount,
    weekdayDays,
    weekendDays,
    stations: stations.size,
    avgDuration: Math.round(totalDuration / totalTrips),
    electricShare: Math.round((electricTrips / totalTrips) * 100),
    avgTripsPerDay: Math.round(totalTrips / dayCount),
    peakHour,
    busiestDay: { date: busiestDay, trips: days.get(busiestDay).trips },
  },
  hourly: { weekday: weekdayHourly, weekend: weekendHourly },
  // Rows Monday..Sunday, columns hour 0..23: average trips started in that hour
  dowHour: dowHour.map((row, d) => row.map((n) => round(n / dowDays[d]))),
  dayOfWeek: zeros(7).map((_, d) =>
    Math.round(dowHour[d].reduce((a, b) => a + b, 0) / dowDays[d]),
  ),
  monthly: [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, m]) => ({
      month,
      electric: Math.round(m.electric / m.dates.size),
      standard: Math.round(m.standard / m.dates.size),
    })),
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
      starts: round(s.starts / dayCount),
      ends: round(s.ends / dayCount),
      // Average weekday trips started per hour
      weekdayHourly: s.weekdayHourStarts.map((n) => round(n / weekdayDays)),
    })),
  riders: {
    members: summarize(riders.members),
    casual: summarize(riders.casual),
    passTypes: [...passTypes.entries()]
      .map(([type, g]) => {
        const { hourlyShare: _hourlyShare, ...rest } = summarize(g);
        return { type, ...rest };
      })
      .sort((a, b) => b.trips - a.trips),
  },
  bikes: {
    electric: fleet("electric"),
    standard: fleet("standard"),
    top: bikeList
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10)
      .map((b) => ({
        id: b.id,
        type: b.type,
        trips: b.trips,
        activeDays: b.activeDays,
      })),
  },
};

await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + "\n");
console.log(
  `Wrote ${path.relative(process.cwd(), OUT_FILE)}: ${totalTrips} trips over ${dayCount} days (${skipped} rows skipped)`,
);
