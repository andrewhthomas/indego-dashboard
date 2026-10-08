# Troubleshooting

## Trip analytics shows "No trip data for ..."

`/trips` reads one small JSON file per period from `public/data/trips/`. If a
period is missing, the data has not been rebuilt since that quarter was added:
run `npm run build-data` (see "Trip data" in the README) and redeploy.

## `npm run build-data` says "No trip CSVs found"

The script reads `data/trips/*.csv`, which is gitignored. Download the
quarterly files from https://www.rideindego.com/about/data/ into that folder,
or pass `--dir=/path/to/csvs`. Every quarter must be present; outputs are
rebuilt from scratch each run.

## Stale build output

```bash
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
