import { describe, it, expect } from "vitest";
import {
  advertisedCourseStart,
  classStartLabel,
  currentCohortStart,
  firstMondayOfNextMonth,
  formatClassDate,
  kampalaYmd,
  nextFirstMonday,
  rolledStartDate,
  toISODate,
} from "./schedule";

describe("nextFirstMonday", () => {
  it("returns this month's first Monday when it is still ahead", () => {
    // 1 Oct 2026 is a Thursday; the first Monday is 5 Oct.
    const d = nextFirstMonday(new Date("2026-10-01T00:00:00Z"));
    expect(toISODate(d)).toBe("2026-10-05");
    expect(d.getUTCDay()).toBe(1);
  });

  it("keeps the date when today is itself the first Monday", () => {
    // 1 Jun 2026 is a Monday, and 00:00 UTC is still 1 Jun in Kampala (UTC+3).
    expect(toISODate(nextFirstMonday(new Date("2026-06-01T00:00:00Z")))).toBe(
      "2026-06-01",
    );
    expect(toISODate(nextFirstMonday(new Date("2026-10-05T12:00:00Z")))).toBe(
      "2026-10-05",
    );
  });

  it("rolls to the following month after the first Monday has passed", () => {
    // 12 Oct 2026 is after Mon 5 Oct; 1 Nov is a Sunday, so the next class is 2 Nov.
    expect(toISODate(nextFirstMonday(new Date("2026-10-12T08:00:00Z")))).toBe(
      "2026-11-02",
    );
    // The day after a first Monday.
    expect(toISODate(nextFirstMonday(new Date("2026-10-06T08:00:00Z")))).toBe(
      "2026-11-02",
    );
  });

  it("uses the Africa/Kampala calendar date, not UTC", () => {
    // 21:30 UTC on 4 Oct is 00:30 on 5 Oct in Kampala — the class day itself.
    expect(kampalaYmd(new Date("2026-10-04T21:30:00Z"))).toBe("2026-10-05");
    expect(toISODate(nextFirstMonday(new Date("2026-10-04T21:30:00Z")))).toBe(
      "2026-10-05",
    );
    // 21:00 UTC on 5 Oct is 00:00 on 6 Oct in Kampala — that class has passed.
    expect(kampalaYmd(new Date("2026-10-05T21:00:00Z"))).toBe("2026-10-06");
    expect(toISODate(nextFirstMonday(new Date("2026-10-05T21:00:00Z")))).toBe(
      "2026-11-02",
    );
    // 21:00 UTC on 1 Jun is 00:00 on 2 Jun in Kampala. 1 Jun was the first Monday.
    expect(toISODate(nextFirstMonday(new Date("2026-06-01T21:00:00Z")))).toBe(
      "2026-07-06",
    );
  });

  it("rolls over the year in December", () => {
    // 1 Jan 2027 is a Friday; the first Monday is 4 Jan.
    expect(toISODate(nextFirstMonday(new Date("2026-12-20T00:00:00Z")))).toBe(
      "2027-01-04",
    );
    // 22:00 UTC on 31 Dec is 01:00 on 1 Jan in Kampala.
    expect(toISODate(nextFirstMonday(new Date("2026-12-31T22:00:00Z")))).toBe(
      "2027-01-04",
    );
  });

  it("always lands on a Monday in the first seven days", () => {
    for (let m = 0; m < 12; m++) {
      const d = nextFirstMonday(new Date(Date.UTC(2026, m, 15, 12)));
      expect(d.getUTCDay()).toBe(1);
      expect(d.getUTCDate()).toBeLessThanOrEqual(7);
    }
  });

  it("rejects an invalid date", () => {
    expect(() => nextFirstMonday(new Date("not-a-date"))).toThrow(RangeError);
  });
});

describe("advertisedCourseStart", () => {
  const oct12 = new Date("2026-10-12T08:00:00Z");

  it("rolls a passed start_date to the next first Monday on or after today", () => {
    expect(toISODate(advertisedCourseStart("2026-09-07", oct12))).toBe(
      "2026-11-02",
    );
    expect(toISODate(advertisedCourseStart("2026-10-05", oct12))).toBe(
      "2026-11-02",
    );
  });

  it("keeps a future first Monday and snaps a future non-Monday forward", () => {
    expect(toISODate(advertisedCourseStart("2026-12-07", oct12))).toBe(
      "2026-12-07",
    );
    // 1 Dec 2026 is a Tuesday; the first Monday is 7 Dec.
    expect(toISODate(advertisedCourseStart("2026-12-01", oct12))).toBe(
      "2026-12-07",
    );
  });

  it("treats a class that starts today as still upcoming", () => {
    expect(
      toISODate(
        advertisedCourseStart("2026-10-05", new Date("2026-10-05T12:00:00Z")),
      ),
    ).toBe("2026-10-05");
  });

  it("treats a missing date as the upcoming first Monday", () => {
    expect(toISODate(advertisedCourseStart(null, new Date("2026-10-01T00:00:00Z")))).toBe(
      "2026-10-05",
    );
    expect(toISODate(advertisedCourseStart("soon", oct12))).toBe("2026-11-02");
  });

  it("labels the rolled date for emails and pages", () => {
    expect(classStartLabel("2026-10-05", oct12)).toBe("Monday, 2 November 2026");
  });
});

describe("rolledStartDate", () => {
  const oct12 = new Date("2026-10-12T08:00:00Z");

  it("returns the next first Monday only when the stored date has passed", () => {
    expect(rolledStartDate("2026-10-05", oct12)).toBe("2026-11-02");
    expect(rolledStartDate("2026-10-05T00:00:00Z", oct12)).toBe("2026-11-02");
    expect(rolledStartDate("2026-10-12", oct12)).toBeNull();
    expect(rolledStartDate("2026-12-07", oct12)).toBeNull();
    expect(rolledStartDate(null, oct12)).toBeNull();
    expect(rolledStartDate("not-a-date", oct12)).toBeNull();
  });
});

describe("firstMondayOfNextMonth", () => {
  it("returns the first Monday of the following month", () => {
    const d = firstMondayOfNextMonth(new Date("2026-07-10T00:00:00Z"));
    expect(toISODate(d)).toBe("2026-08-03");
    expect(d.getUTCDay()).toBe(1);
  });

  it("handles a month whose 1st is already a Monday", () => {
    const d = firstMondayOfNextMonth(new Date("2026-06-15T00:00:00Z"));
    expect(toISODate(d)).toBe("2026-07-06");
  });

  it("rolls over the year in December", () => {
    const d = firstMondayOfNextMonth(new Date("2026-12-20T00:00:00Z"));
    expect(toISODate(d)).toBe("2027-01-04");
  });

  it("always lands on a Monday for every month of a year", () => {
    for (let m = 0; m < 12; m++) {
      const d = firstMondayOfNextMonth(new Date(Date.UTC(2026, m, 15)));
      expect(d.getUTCDay()).toBe(1);
      expect(d.getUTCDate()).toBeLessThanOrEqual(7);
    }
  });

  it("formats a friendly label", () => {
    const d = new Date("2026-08-03T00:00:00Z");
    expect(formatClassDate(d)).toBe("Monday, 3 August 2026");
  });
});

describe("currentCohortStart", () => {
  it("is the next first Monday on or after the Kampala date, as YYYY-MM-DD", () => {
    // 28 Sep 2026 is after September's first Monday (7 Sep) → 5 Oct.
    expect(currentCohortStart(new Date(Date.UTC(2026, 8, 28)))).toBe("2026-10-05");
    // 15 May 2026 is after 4 May → 1 Jun, which is itself a Monday.
    expect(currentCohortStart(new Date(Date.UTC(2026, 4, 15)))).toBe("2026-06-01");
    // 1 Oct is before 5 Oct, so the cohort on sale is still this month.
    expect(currentCohortStart(new Date("2026-10-01T00:00:00Z"))).toBe("2026-10-05");
  });
});
