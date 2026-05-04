import { describe, it, expect } from "vitest";
import {
  pairKey,
  pathForTrip,
  timestampsForPath,
} from "./route-data";
import type { RouteCache } from "./route-data";

describe("pairKey", () => {
  it("formats as from-to", () => {
    expect(pairKey(3163, 3374)).toBe("3163-3374");
  });

  it("is direction-sensitive (f→t ≠ t→f)", () => {
    expect(pairKey(1, 2)).not.toBe(pairKey(2, 1));
  });
});

describe("pathForTrip", () => {
  const stationsRoutes: RouteCache = {
    "3163-3374": [
      [-75.181, 39.95],
      [-75.178, 39.96],
      [-75.18, 39.97],
    ],
  };

  it("returns routed polyline when the pair is cached", () => {
    const path = pathForTrip(
      { s: 0, e: 1, f: 3163, t: 3374 },
      stationsRoutes,
    );
    expect(path).toHaveLength(3);
    expect(path[1]).toEqual([-75.178, 39.96]);
  });

  it("falls back to straight line when pair is missing", () => {
    // Note: this asserts stationMap-backed fallback. Uses real stations.json
    // which must contain both IDs. 3004 and 3005 are known station IDs.
    const path = pathForTrip({ s: 0, e: 1, f: 3004, t: 3005 }, {});
    expect(path).toHaveLength(2);
  });

  it("returns empty array if either station is unknown", () => {
    const path = pathForTrip(
      { s: 0, e: 1, f: 99_999, t: 99_998 },
      {},
    );
    expect(path).toEqual([]);
  });
});

describe("timestampsForPath", () => {
  it("returns [s, e] for a 2-point path", () => {
    expect(timestampsForPath([[0, 0], [1, 1]], 1000, 2000)).toEqual([1000, 2000]);
  });

  it("returns [s] for a 1-point path", () => {
    expect(timestampsForPath([[0, 0]], 1000, 2000)).toEqual([1000]);
  });

  it("returns [] for an empty path", () => {
    expect(timestampsForPath([], 1000, 2000)).toEqual([]);
  });

  it("interpolates linearly along an equal-segment path", () => {
    // 4 vertices, 3 equal segments → t = [s, s+1/3, s+2/3, e]
    const path: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ];
    const timestamps = timestampsForPath(path, 0, 3000);
    expect(timestamps).toHaveLength(4);
    expect(timestamps[0]).toBe(0);
    expect(timestamps[1]).toBeCloseTo(1000, 3);
    expect(timestamps[2]).toBeCloseTo(2000, 3);
    expect(timestamps[3]).toBe(3000);
  });

  it("weights unequal segments proportionally", () => {
    // Segment 1 length 1, segment 2 length 3. Total = 4.
    // Mid vertex is at 1/4 of elapsed time.
    const path: [number, number][] = [
      [0, 0],
      [1, 0],
      [4, 0],
    ];
    const timestamps = timestampsForPath(path, 0, 4000);
    expect(timestamps[1]).toBeCloseTo(1000, 3);
  });

  it("returns all-s for a zero-length path (duplicate points)", () => {
    const path: [number, number][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    expect(timestampsForPath(path, 500, 1500)).toEqual([500, 500, 500]);
  });
});
