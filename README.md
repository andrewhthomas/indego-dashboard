# Indego Bike Dashboard

An Astro dashboard for visualizing Philadelphia's Indego bike share data.

## Features

- **Real-time station status** with 30-second refresh intervals
- **Bike type breakdown** (Classic, Electric, Smart bikes)
- **Interactive map** with color-coded station status
- **Station search and filtering** by name or address
- **Detailed station view** showing individual bike information
- **System-wide statistics** with live availability metrics
- **Historical trip analysis** of every trip since 2016, filterable by year and month
- **Trip analytics dashboard** with daily/hourly patterns
- **Trip insights and trends** on main dashboard
- **Dark mode support** with system preference detection
- **Responsive dashboard** with modern UI components
- **Table and map views** for station data

## Tech Stack

- **Framework**: Astro 7 (static pages with React islands)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Typography**: Inter font family
- **UI Components**: shadcn/ui
- **Theme**: Dark/Light mode via a small theme hook (`src/lib/theme.ts`)
- **Charts**: Recharts
- **Maps**: Leaflet + React-Leaflet, OpenFreeMap vector basemap via MapLibre GL
- **Data Processing**: precomputed at build time with Papa Parse (`scripts/build-trip-data.mjs`)
- **Deployment**: Cloudflare Workers (static assets)

## Getting Started

### Prerequisites

- Node.js 22+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd indego-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:4321](http://localhost:4321) in your browser.

## Usage

### Dark Mode

The dashboard includes a theme toggle in the header that allows switching between:

- **Light mode**: Traditional light theme with a light map style
- **Dark mode**: Dark theme with a dark map style for low-light environments
- **System**: Automatically follows your device's theme preference

Key dark mode features:

- All UI components automatically switch themes
- Maps use the OpenFreeMap dark style when in dark mode
- Theme preference is saved and persists across sessions
- Smooth transitions between light and dark themes

## Data Sources

This dashboard uses multiple data sources:

- **BTS Status API**: `https://bts-status.bicycletransit.workers.dev/phl` (real-time station status)
- **Trip Data**: Indego quarterly trip records since Q1 2016, precomputed into static JSON under `public/data/trips/`
- **Live Updates**: Station data refreshes every 30 seconds
- **Historical Analysis**: Trip patterns, usage trends, and bike type distribution

## Deployment

The app deploys to Cloudflare Workers as static assets: every page is
prerendered and all trip numbers are precomputed JSON, so there is no server
code and no database.

```bash
npx wrangler login        # once
npm run deploy            # astro check + astro build + wrangler deploy
```

## Trip data

The browser never downloads raw trip CSVs. `npm run build-data` reads Indego's
quarterly trip files and writes small aggregate files that are committed:

- `public/data/trips/all.json`, `YYYY.json`, `YYYY-MM.json`: the stats behind
  `/trips` for the whole history, each year and each month
- `src/data/trip-index.json`: which periods exist (drives the period filter)
- `src/data/trip-patterns.json`: `/patterns` and the home page trip insights

To add a quarter:

1. Download the CSV from https://www.rideindego.com/about/data/ into
   `data/trips/` (gitignored). File names do not matter.
2. Run `npm run build-data`, then commit the changed JSON and deploy.

The script handles the format changes across the years (seconds vs minutes,
`start_station_id` vs `start_station`, two date formats, missing `bike_type`
before Q3 2018, renamed pass types) and drops trips repeated across adjacent
quarterly files. It needs all the CSVs present, since every output is rebuilt
from scratch.

Station names come from `src/data/station-names.json`, built from Indego's
station table CSV (it includes retired stations that still appear in trips).
Refresh it before `build-data` when Indego publishes a new table:

```bash
npm run build-stations -- --file=./indego-stations-2026-07-15.csv
```

## Development

- `npm run dev` - Start development server (runs in workerd)
- `npm run build` - Type-check and build for production
- `npm run preview` - Serve the production build locally in workerd
- `npm run check` - Run `astro check` (TypeScript + Astro diagnostics)
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run build-stations` - Regenerate `src/data/station-names.json` from the station table CSV
- `npm run build-data` - Regenerate all precomputed trip data from `data/trips/*.csv`
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting

## License

MIT
