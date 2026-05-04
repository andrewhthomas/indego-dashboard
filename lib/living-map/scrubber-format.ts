/**
 * Pure formatting helpers for the scrubber chrome.
 * Kept separate from the React component so they're trivially unit-testable.
 */

const MS_PER_DAY = 24 * 3_600_000;

export function formatTimeReadout(ms: number): string {
  const clamped = Math.max(0, Math.min(MS_PER_DAY - 1, ms));
  const h24 = Math.floor(clamped / 3_600_000);
  const m = Math.floor((clamped % 3_600_000) / 60_000);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDateReadout(iso: string): string {
  // iso is "YYYY-MM-DD". Render "Sat, Sep 20" (no year — year is implicit in v1).
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}
