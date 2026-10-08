// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Pages are prerendered; only /api/trips/* runs on demand in the Worker.
  output: "static",
  adapter: cloudflare({ imageService: "passthrough" }),
  session: false,
  // Emit /trips.html so Workers assets serve /trips without a redirect.
  build: { format: "file" },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
