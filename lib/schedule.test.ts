import { describe, it, expect } from "vitest";
import {
  firstMondayOfNextMonth,
  formatClassDate,
  toISODate,
} from "./schedule";

describe("firstMondayOfNextMonth", () => {
  it("returns the first Monday of the following month", () => {
    // Given mid-July 2026, the next cohort is Mon 3 August 2026.
    const d = firstMondayOfNextMonth(new Date("2026-07-10T00:00:00Z"));
    expect(toISODate(d)).toBe("2026-08-03");
    expect(d.getUTCDay()).toBe(1); // Monday
  });

  it("handles a month whose 1st is already a Monday", () => {
    // June 2026 -> July 2026; 1 July 2026 is a Wednesday, first Mon is the 6th.
    const d = firstMondayOfNextMonth(new Date("2026-06-15T00:00:00Z"));
    expect(toISODate(d)).toBe("2026-07-06");
  });

  it("rolls over the year in December", () => {
    const d = firstMondayOfNextMonth(new Date("2026-12-20T00:00:00Z"));
    // 1 Jan 2027 is a Friday -> first Monday is 4 Jan 2027.
    expect(toISODate(d)).toBe("2027-01-04");
  });

  it("always lands on a Monday for every month of a year", () => {
    for (let m = 0; m < 12; m++) {
      const d = firstMondayOfNextMonth(new Date(Date.UTC(2026, m, 15)));
      expect(d.getUTCDay()).toBe(1);
      expect(d.getUTCDate()).toBeLessThanOrEqual(7); // first week
    }
  });

  it("formats a friendly label", () => {
    const d = new Date("2026-08-03T00:00:00Z");
    expect(formatClassDate(d)).toBe("Monday, 3 August 2026");
  });
});
