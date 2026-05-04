import { describe, it, expect } from "vitest";
import { filterInFlightAtTime, type LivingMapTrip } from "./trip-data";

const at = (hours: number, mins = 0) => hours * 3_600_000 + mins * 60_000;

const trips: LivingMapTrip[] = [
  // 09:00 → 09:15
  { s: at(9), e: at(9, 15), f: 1, t: 2 },
  // 10:00 → 10:30
  { s: at(10), e: at(10, 30), f: 2, t: 3 },
  // 23:55 → 24:10 (crosses midnight, e is >24h)
  { s: at(23, 55), e: at(24, 10), f: 3, t: 4 },
];

describe("filterInFlightAtTime", () => {
  it("returns trips currently in flight at given time", () => {
    // 09:05 — first trip is active, others not yet started
    expect(filterInFlightAtTime(trips, at(9, 5))).toHaveLength(1);
    // 10:15 — second trip active, first is over
    const at1015 = filterInFlightAtTime(trips, at(10, 15));
    expect(at1015).toHaveLength(1);
    expect(at1015[0].f).toBe(2);
  });

  it("returns empty at a dead time", () => {
    // 07:00 — nothing active yet
    expect(filterInFlightAtTime(trips, at(7))).toHaveLength(0);
    // 15:00 — between the 10:30 end and 23:55 start
    expect(filterInFlightAtTime(trips, at(15))).toHaveLength(0);
  });

  it("correctly handles trips crossing midnight", () => {
    // 23:59 — the midnight-crossing trip is active
    const late = filterInFlightAtTime(trips, at(23, 59));
    expect(late).toHaveLength(1);
    expect(late[0].f).toBe(3);
    // 24:05 (= 00:05 next day expressed on start-date timeline) — still active
    expect(filterInFlightAtTime(trips, at(24, 5))).toHaveLength(1);
  });

  it("is exclusive on the end boundary", () => {
    // Exactly at trip end → NOT in flight (trip has already dropped off)
    expect(filterInFlightAtTime(trips, at(9, 15))).toHaveLength(0);
  });

  it("handles empty input", () => {
    expect(filterInFlightAtTime([], at(12))).toEqual([]);
  });
});
