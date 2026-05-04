import { describe, it, expect } from "vitest";
import {
  parseIndegoTimestamp,
  millisSinceMidnight,
  rowToTrip,
  parseTripsIntoDateMap,
} from "./preprocess-trips";

const STATIONS = new Set([3163, 3374, 3004]);

describe("parseIndegoTimestamp", () => {
  it("parses single-digit month/day", () => {
    const d = parseIndegoTimestamp("7/1/2025 0:06");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2025);
    expect(d!.getMonth()).toBe(6); // 0-indexed July
    expect(d!.getDate()).toBe(1);
    expect(d!.getHours()).toBe(0);
    expect(d!.getMinutes()).toBe(6);
  });

  it("parses double-digit month/day", () => {
    const d = parseIndegoTimestamp("11/23/2025 14:45");
    expect(d!.getMonth()).toBe(10);
    expect(d!.getDate()).toBe(23);
    expect(d!.getHours()).toBe(14);
  });

  it("returns null on garbage", () => {
    expect(parseIndegoTimestamp("")).toBeNull();
    expect(parseIndegoTimestamp("not a date")).toBeNull();
    expect(parseIndegoTimestamp("2025-07-01 00:06")).toBeNull(); // wrong format
  });
});

describe("millisSinceMidnight", () => {
  it("returns 0 for midnight", () => {
    const d = new Date(2025, 8, 20, 0, 0, 0, 0);
    expect(millisSinceMidnight(d)).toBe(0);
  });

  it("returns 43_200_000 for noon", () => {
    const d = new Date(2025, 8, 20, 12, 0, 0, 0);
    expect(millisSinceMidnight(d)).toBe(12 * 3_600_000);
  });

  it("handles seconds + ms", () => {
    const d = new Date(2025, 8, 20, 1, 2, 3, 456);
    expect(millisSinceMidnight(d)).toBe(
      1 * 3_600_000 + 2 * 60_000 + 3 * 1000 + 456,
    );
  });
});

describe("rowToTrip", () => {
  const row = {
    start_time: "9/20/2025 10:00",
    end_time: "9/20/2025 10:15",
    start_station: "3163",
    end_station: "3374",
  };

  it("parses a valid row", () => {
    const parsed = rowToTrip(row, STATIONS);
    expect(parsed).not.toBeNull();
    expect(parsed!.dateKey).toBe("2025-09-20");
    expect(parsed!.trip).toEqual({
      s: 10 * 3_600_000, // 10:00
      e: 10 * 3_600_000 + 15 * 60_000, // 10:15
      f: 3163,
      t: 3374,
    });
  });

  it("drops rows with unknown start station", () => {
    expect(rowToTrip({ ...row, start_station: "9999" }, STATIONS)).toBeNull();
  });

  it("drops rows with unknown end station", () => {
    expect(rowToTrip({ ...row, end_station: "9999" }, STATIONS)).toBeNull();
  });

  it("drops rows with reversed times", () => {
    expect(
      rowToTrip(
        { ...row, start_time: "9/20/2025 10:15", end_time: "9/20/2025 10:00" },
        STATIONS,
      ),
    ).toBeNull();
  });

  it("drops rows with unparsable timestamps", () => {
    expect(rowToTrip({ ...row, start_time: "garbage" }, STATIONS)).toBeNull();
  });

  it("handles trips that cross midnight", () => {
    const midnight = rowToTrip(
      {
        start_time: "9/20/2025 23:55",
        end_time: "9/21/2025 0:10",
        start_station: "3163",
        end_station: "3374",
      },
      STATIONS,
    );
    expect(midnight!.dateKey).toBe("2025-09-20"); // attributed to start date
    expect(midnight!.trip.s).toBe(23 * 3_600_000 + 55 * 60_000);
    // e is beyond 24h because it crossed midnight
    expect(midnight!.trip.e).toBe(24 * 3_600_000 + 10 * 60_000);
  });
});

describe("parseTripsIntoDateMap", () => {
  const HEADER =
    "trip_id,duration,start_time,end_time,start_station,start_lat,start_lon,end_station,end_lat,end_lon,bike_id,plan_duration,trip_route_category,passholder_type,bike_type";

  it("groups valid rows by start date, drops invalid", () => {
    const csv = [
      HEADER,
      // Valid Sep 20 trip
      "1,15,9/20/2025 10:00,9/20/2025 10:15,3163,39.9,-75.1,3374,39.97,-75.18,b1,30,One Way,Indego30,electric",
      // Valid Sep 21 trip
      "2,20,9/21/2025 14:00,9/21/2025 14:20,3004,39.95,-75.16,3374,39.97,-75.18,b2,30,One Way,Indego30,standard",
      // Invalid: unknown start station
      "3,10,9/20/2025 11:00,9/20/2025 11:10,9999,0,0,3374,39.97,-75.18,b3,30,One Way,Indego30,electric",
      // Invalid: unparsable times
      "4,10,garbage,also garbage,3163,0,0,3374,39.97,-75.18,b4,30,One Way,Indego30,electric",
    ].join("\n");

    const map = parseTripsIntoDateMap(csv, STATIONS);
    expect(map.size).toBe(2);
    expect(map.get("2025-09-20")!).toHaveLength(1);
    expect(map.get("2025-09-21")!).toHaveLength(1);
    expect(map.get("2025-09-20")![0]).toEqual({
      s: 10 * 3_600_000,
      e: 10 * 3_600_000 + 15 * 60_000,
      f: 3163,
      t: 3374,
    });
  });

  it("handles empty CSV gracefully", () => {
    const map = parseTripsIntoDateMap(HEADER, STATIONS);
    expect(map.size).toBe(0);
  });
});
