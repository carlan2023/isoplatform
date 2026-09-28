import { describe, it, expect } from "vitest";
import { courseSlug, coursePath, isUuid } from "./course-slug";

describe("courseSlug", () => {
  it("builds a readable slug from a course title", () => {
    expect(courseSlug("ISO 9001:2015 Lead Auditor Training")).toBe(
      "iso-9001-2015-lead-auditor-training",
    );
    expect(courseSlug("  ISO 45001 & ISO 14001 (Virtual) ")).toBe(
      "iso-45001-and-iso-14001-virtual",
    );
  });

  it("builds the public course path", () => {
    expect(coursePath({ title: "ISO 22000 Lead Auditor" })).toBe(
      "/courses/iso-22000-lead-auditor",
    );
  });
});

describe("isUuid", () => {
  it("recognises legacy UUID course URLs", () => {
    expect(isUuid("b59f3877-4312-4185-925d-01f69f4a33f2")).toBe(true);
    expect(isUuid("iso-9001-lead-auditor")).toBe(false);
  });
});
