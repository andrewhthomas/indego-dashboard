import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/lib/theme";

// MapLibre GL v6 is ESM-only and needs its worker URL from the bundler.
setWorkerUrl(workerUrl);

// OpenFreeMap vector styles (free, no API key)
const LIGHT_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

export function ThemeAwareTileLayer() {
  const { resolvedTheme } = useTheme();
  const map = useMap();

  // Determine theme type
  const isDark = resolvedTheme === "dark";

  // Recreate the basemap layer when the theme changes. The layer adds the
  // style's own attribution to the Leaflet control.
  useEffect(() => {
    const layer = maplibreGL({
      style: isDark ? DARK_STYLE_URL : LIGHT_STYLE_URL,
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, isDark]);

  return null;
}
