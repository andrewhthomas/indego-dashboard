import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // deck.gl needs real WebGL; headless Chromium defaults to SwiftShader
        // (software), which can fail to bind a GL context. --use-gl=angle
        // routes through ANGLE/Metal on macOS so the WebGL canvas actually mounts.
        launchOptions: {
          args: [
            "--use-gl=angle",
            "--use-angle=metal",
            "--enable-webgl",
            "--ignore-gpu-blocklist",
          ],
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
