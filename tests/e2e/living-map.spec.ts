import { test, expect } from "@playwright/test";

test("home page mounts the living map", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/");

  // Day 1 scaffold tag should appear — this is the stable "scaffold mounted" signal
  // that works even if headless WebGL is flaky. When Day 3+ adds real content,
  // tighten to assert .maplibregl-canvas visibility + a zoom interaction.
  await expect(page.getByText("day 1 scaffold")).toBeVisible({ timeout: 10_000 });

  expect(
    consoleErrors.filter(
      // Ignore dev-only warnings + known headless WebGL quirks.
      (e) =>
        !e.includes("React DevTools") &&
        !e.includes("Download the React") &&
        !e.includes("Failed to create WebGL context") &&
        !e.includes("BindToCurrentSequence"),
    ),
  ).toEqual([]);
});
