# Troubleshooting

## Trip analytics shows "Failed to fetch indego-trips-2025-qN.csv"

The trip CSVs are read from the `indego-trips` R2 bucket through
`/api/trips/<file>.csv`.

- **Local dev / preview:** the local R2 simulator starts empty. Seed it once
  (see "Trip data (R2)" in the README) using `--local`.
- **Production:** confirm the objects exist with
  `npx wrangler r2 object get indego-trips/indego-trips-2025-q1.csv --remote --pipe | head -2`.

## Stale build or type errors after changing `wrangler.jsonc`

```bash
npm run cf-typegen
rm -rf dist .astro node_modules/.vite
npm run build
```

## Port conflicts

`astro dev` and `astro preview` default to port 4321. Pick another with
`npm run dev -- --port 4400`. `astro preview` runs in the background; stop it
with `npx astro preview stop`.

## Map errors ("window is not defined")

Leaflet touches `window` at import time. Components that import `leaflet` or
`react-leaflet` must be loaded through `clientOnly()` from
`src/lib/client-only.tsx` so they are skipped during prerendering.

## Slow trip analytics

The browser downloads and parses all four quarterly CSVs (about 180 MB before
compression). This needs a modern browser and a few GB of free memory.
