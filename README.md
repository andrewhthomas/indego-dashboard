# Indego Bike Dashboard

A Next.js dashboard for visualizing Philadelphia's Indego bike share data.

## Features

- **Real-time station status** with 30-second refresh intervals
- **Bike type breakdown** (Classic, Electric, Smart bikes)
- **Interactive map** with color-coded station status
- **Station search and filtering** by name or address
- **Detailed station view** showing individual bike information
- **System-wide statistics** with live availability metrics
- **Historical trip analysis** with 365K+ Q2 2025 trips
- **Trip analytics dashboard** with daily/hourly patterns
- **Trip insights and trends** on main dashboard
- **Dark mode support** with system preference detection
- **Responsive dashboard** with modern UI components
- **Table and map views** for station data

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Typography**: Inter font family
- **UI Components**: shadcn/ui
- **Theme**: next-themes (Dark/Light mode)
- **Charts**: Recharts
- **Maps**: Leaflet + React-Leaflet
- **Data Processing**: Papa Parse (CSV parsing)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
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

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
- **Trip Data CSV**: Indego Q2 2025 trip records (365,761 trips) stored locally
- **Live Updates**: Station data refreshes every 30 seconds
- **Historical Analysis**: Trip patterns, usage trends, and bike type distribution

## Deployment

The app is configured for deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Deploy with default settings

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
