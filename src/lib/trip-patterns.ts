import patterns from "@/data/trip-patterns.json";

// Precomputed by scripts/build-trip-patterns.mjs from the quarterly trip CSVs.
export const tripPatterns = patterns;
export type TripPatterns = typeof patterns;

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 0 -> "12am", 13 -> "1pm" */
export function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}

/** "2025-09-11" -> "Sep 11" without going through a local-time Date */
export function formatIsoDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}
