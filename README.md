# Indego Bike Dashboard

An Astro dashboard for visualizing Philadelphia's Indego bike share data.

## Features

- **Real-time station status** with 30-second refresh intervals
- **Bike type breakdown** (Classic, Electric, Smart bikes)
- **Interactive map** with color-coded station status
- **Station search and filtering** by name or address
- **Detailed station view** showing individual bike information
- **System-wide statistics** with live availability metrics
- **Historical trip analysis** with Q1–Q4 2025 trip data
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
- **Maps**: Leaflet + React-Leaflet
- **Data Processing**: Papa Parse (CSV parsing)
- **Deployment**: Cloudflare Workers (static assets + R2)

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

- **Light mode**: Traditional light theme with standard OpenStreetMap tiles
- **Dark mode**: Dark theme with dark map tiles for low-light environments
- **System**: Automatically follows your device's theme preference

Key dark mode features:

- All UI components automatically switch themes
- Maps use dark tiles from CartoDB when in dark mode
- Theme preference is saved and persists across sessions
- Smooth transitions between light and dark themes

## Data Sources

This dashboard uses multiple data sources:

- **BTS Status API**: `https://bts-status.bicycletransit.workers.dev/phl` (real-time station status)
- **Trip Data CSV**: Indego Q1–Q4 2025 trip records stored in the `indego-trips` Cloudflare R2 bucket, served by the Worker at `/api/trips/<file>.csv`
- **Live Updates**: Station data refreshes every 30 seconds
- **Historical Analysis**: Trip patterns, usage trends, and bike type distribution

## Deployment

The app deploys to Cloudflare Workers. Pages are prerendered and served as
static assets; the only on-demand route is `/api/trips/[file]`, which streams
the quarterly trip CSVs from R2 (binding `TRIPS_BUCKET` in `wrangler.jsonc`).

```bash
npx wrangler login        # once
npm run deploy            # astro check + astro build + wrangler deploy
```

### Trip data (R2)

One-time setup, and again whenever a quarter is added (also add the file name
to `QUARTER_FILES` in `src/lib/trip-data.ts`):

```bash
npx wrangler r2 bucket create indego-trips
gzip -9 -k indego-trips-2025-q1.csv
npx wrangler r2 object put indego-trips/indego-trips-2025-q1.csv \
  --remote --content-type text/csv --content-encoding gzip \
  --file ./indego-trips-2025-q1.csv.gz
```

The CSVs are stored gzipped (about 6x smaller on the wire); the object key
keeps the plain `.csv` name and the Worker passes the gzip bytes through.

For local development, run the same `r2 object put` with `--local` instead of
`--remote` to seed the local R2 simulator in `.wrangler/state`.

## Development

- `npm run dev` - Start development server (runs in workerd)
- `npm run build` - Type-check and build for production
- `npm run preview` - Serve the production build locally in workerd
- `npm run check` - Run `astro check` (TypeScript + Astro diagnostics)
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run cf-typegen` - Regenerate binding types after editing `wrangler.jsonc`
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting

## License

MIT
