import { describe, it, expect } from "vitest";
import { normalizeUgandaMobile } from "./phone";

describe("normalizeUgandaMobile", () => {
  it.each([
    ["0771234567", "+256771234567"],
    ["0771 234 567", "+256771234567"],
    ["771234567", "+256771234567"],
    ["256771234567", "+256771234567"],
    ["+256771234567", "+256771234567"],
    ["+256 (0) 771-234-567", "+256771234567"],
    ["+2560771234567", "+256771234567"],
    ["00256751234567", "+256751234567"],
    ["0701234567", "+256701234567"],
  ])("normalises %s -> %s", (input, expected) => {
    expect(normalizeUgandaMobile(input)).toBe(expected);
  });

  it.each([
    [""],
    ["   "],
    ["abc"],
    ["077123456"], // too short
    ["07712345678"], // too long
    ["0411234567"], // landline (not 7x)
    ["+254712345678"], // Kenya
    ["+1 202 555 0100"],
    ["0771234567x"],
  ])("rejects %s", (input) => {
    expect(normalizeUgandaMobile(input)).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(normalizeUgandaMobile(null)).toBeNull();
    expect(normalizeUgandaMobile(undefined)).toBeNull();
  });
});
