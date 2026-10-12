import { describe, expect, it } from "vitest";
import { pickEnrollmentToReuse } from "./enrollment-reuse";

const cohort = "2026-11-02";

describe("pickEnrollmentToReuse", () => {
  it("reuses a cancelled row instead of creating another enrollment", () => {
    expect(
      pickEnrollmentToReuse(
        [{ id: "c1", status: "cancelled", cohort_start: cohort }],
        cohort,
      ),
    ).toEqual({ kind: "reuse", id: "c1", reset: true });
  });

  it("reuses a pending row without resetting it", () => {
    expect(
      pickEnrollmentToReuse(
        [{ id: "p1", status: "pending", cohort_start: "2026-10-05" }],
        cohort,
      ),
    ).toEqual({ kind: "reuse", id: "p1", reset: false });
  });

  it("blocks a second row when a seat is confirmed or a payment is in progress", () => {
    expect(
      pickEnrollmentToReuse(
        [
          { id: "new-cancel", status: "cancelled", cohort_start: cohort },
          { id: "paid", status: "confirmed", cohort_start: cohort },
        ],
        cohort,
      ),
    ).toEqual({ kind: "already", id: "paid", status: "confirmed" });
    expect(
      pickEnrollmentToReuse(
        [{ id: "hold", status: "awaiting_confirmation", cohort_start: cohort }],
        cohort,
      ),
    ).toEqual({ kind: "already", id: "hold", status: "awaiting_confirmation" });
  });

  it("ignores a cancelled enrollment from an earlier cohort", () => {
    expect(
      pickEnrollmentToReuse(
        [{ id: "old", status: "cancelled", cohort_start: "2026-08-03" }],
        cohort,
      ),
    ).toEqual({ kind: "create" });
  });
});
