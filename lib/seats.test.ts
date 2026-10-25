import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { formatSeatsRemaining } from "./seats";

describe("formatSeatsRemaining", () => {
  it("shows only the remaining number", () => {
    expect(formatSeatsRemaining(20)).toBe("20 seats remaining");
    expect(formatSeatsRemaining(1)).toBe("1 seats remaining");
    expect(formatSeatsRemaining(0)).toBe("0 seats remaining");
  });

  it("does not mention capacity as X of Y or X out of Y", () => {
    const label = formatSeatsRemaining(20);
    expect(label).not.toMatch(/\bof\b/i);
    expect(label).not.toMatch(/out of/i);
    expect(label).not.toContain("/");
  });
});

describe("seats remaining display", () => {
  const pages = [
    "app/enroll/[id]/page.tsx",
    "app/courses/[id]/page.tsx",
    "app/page.tsx",
  ];

  it("uses the remaining-only label on every public seats display", () => {
    for (const page of pages) {
      const source = readFileSync(page, "utf8");
      expect(source).toContain("formatSeatsRemaining");
      expect(source).not.toMatch(/\$\{seatsLeft\} of \$\{course\.seats_total\}/);
      expect(source).not.toMatch(/out of/);
    }
  });
});
