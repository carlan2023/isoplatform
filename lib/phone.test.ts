import { describe, it, expect } from "vitest";
import {
  inspectMomoPhone,
  MOMO_PREFIX_ERROR,
  normalizeUgandaMobile,
} from "./phone";

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
    ["0741234567", "+256741234567"],
    ["0751234567", "+256751234567"],
    ["0761234567", "+256761234567"],
    ["0781234567", "+256781234567"],
    ["0791234567", "+256791234567"],
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
    ["0712345678"], // not MTN or Airtel
    ["0721234567"],
    ["0731234567"],
    ["+256711234567"],
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

describe("inspectMomoPhone", () => {
  it("shows the national digits after a fixed +256 prefix", () => {
    expect(inspectMomoPhone("+256771234567").local).toBe("771234567");
    expect(inspectMomoPhone("0771234567").local).toBe("771234567");
    expect(inspectMomoPhone("256771234567").local).toBe("771234567");
    expect(inspectMomoPhone("771234567").local).toBe("771234567");
  });

  it("names the network as soon as the prefix is known", () => {
    expect(inspectMomoPhone("77").network).toBe("MTN");
    expect(inspectMomoPhone("77").e164).toBeNull();
    expect(inspectMomoPhone("77").error).toBeNull();
    expect(inspectMomoPhone("076").network).toBe("MTN");
    expect(inspectMomoPhone("0781").network).toBe("MTN");
    expect(inspectMomoPhone("079").network).toBe("MTN");
    expect(inspectMomoPhone("70").network).toBe("Airtel");
    expect(inspectMomoPhone("074").network).toBe("Airtel");
    expect(inspectMomoPhone("75").network).toBe("Airtel");
    expect(inspectMomoPhone("701234567")).toMatchObject({
      network: "Airtel",
      e164: "+256701234567",
      error: null,
    });
  });

  it("rejects an unsupported prefix immediately", () => {
    expect(inspectMomoPhone("71")).toMatchObject({
      network: null,
      e164: null,
      error: MOMO_PREFIX_ERROR,
    });
    expect(inspectMomoPhone("0712").error).toBe(MOMO_PREFIX_ERROR);
    expect(inspectMomoPhone("8").error).toBe(MOMO_PREFIX_ERROR);
  });

  it("waits while the learner has only typed 7", () => {
    expect(inspectMomoPhone("7")).toEqual({
      local: "7",
      e164: null,
      network: null,
      error: null,
    });
  });
});
