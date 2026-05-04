import { describe, it, expect } from "vitest";
import {
  formatTimeReadout,
  formatDateReadout,
  addDaysIso,
} from "./scrubber-format";

describe("formatTimeReadout", () => {
  it("renders midnight as 12:00 AM", () => {
    expect(formatTimeReadout(0)).toBe("12:00 AM");
  });

  it("renders noon as 12:00 PM", () => {
    expect(formatTimeReadout(12 * 3_600_000)).toBe("12:00 PM");
  });

  it("renders 9:05 AM correctly", () => {
    expect(formatTimeReadout(9 * 3_600_000 + 5 * 60_000)).toBe("9:05 AM");
  });

  it("pads single-digit minutes", () => {
    expect(formatTimeReadout(14 * 3_600_000 + 3 * 60_000)).toBe("2:03 PM");
  });

  it("clamps negative values to 12:00 AM", () => {
    expect(formatTimeReadout(-1000)).toBe("12:00 AM");
  });

  it("clamps values beyond 24h to 11:59 PM", () => {
    expect(formatTimeReadout(25 * 3_600_000)).toBe("11:59 PM");
  });
});

describe("formatDateReadout", () => {
  it("renders ISO date as short weekday + month + day", () => {
    // Sep 20, 2025 was a Saturday
    expect(formatDateReadout("2025-09-20")).toBe("Sat, Sep 20");
  });

  it("renders single-digit day without padding in the label", () => {
    // Jul 1 2025 was a Tuesday
    expect(formatDateReadout("2025-07-01")).toBe("Tue, Jul 1");
  });
});

describe("addDaysIso", () => {
  it("advances by one day", () => {
    expect(addDaysIso("2025-09-20", 1)).toBe("2025-09-21");
  });

  it("steps back by one day", () => {
    expect(addDaysIso("2025-09-20", -1)).toBe("2025-09-19");
  });

  it("handles month boundary", () => {
    expect(addDaysIso("2025-09-30", 1)).toBe("2025-10-01");
    expect(addDaysIso("2025-10-01", -1)).toBe("2025-09-30");
  });

  it("handles year boundary", () => {
    expect(addDaysIso("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("is idempotent for delta=0", () => {
    expect(addDaysIso("2025-09-20", 0)).toBe("2025-09-20");
  });
});
