import { describe, it, expect } from "vitest";
import {
  pricePerPerson,
  computePricing,
  formatUGX,
  isValidPayAmount,
  INDIVIDUAL_PRICE,
  TEAM_PRICE,
  TEAM_MIN_SIZE,
  MAX_TEAM_SIZE,
} from "./pricing";

describe("pricePerPerson", () => {
  it("uses the individual rate below the team threshold", () => {
    expect(pricePerPerson(1)).toBe(INDIVIDUAL_PRICE);
    expect(pricePerPerson(TEAM_MIN_SIZE - 1)).toBe(INDIVIDUAL_PRICE);
  });

  it("uses the team rate at and above the threshold", () => {
    expect(pricePerPerson(TEAM_MIN_SIZE)).toBe(TEAM_PRICE);
    expect(pricePerPerson(TEAM_MIN_SIZE + 2)).toBe(TEAM_PRICE);
  });
});

describe("computePricing", () => {
  it("prices a single individual booking", () => {
    expect(computePricing(1)).toEqual({
      team: 1,
      perPerson: INDIVIDUAL_PRICE,
      fullAmount: 1_000_000,
      minDeposit: 300_000,
    });
  });

  it("applies the team rate and 30% deposit for a team of three", () => {
    const { fullAmount, minDeposit } = computePricing(3);
    expect(fullAmount).toBe(2_100_000);
    expect(minDeposit).toBe(630_000);
  });

  it("clamps team size to the allowed range", () => {
    expect(computePricing(0).team).toBe(1);
    expect(computePricing(-5).team).toBe(1);
    expect(computePricing(999).team).toBe(MAX_TEAM_SIZE);
  });
});

describe("formatUGX", () => {
  it("prefixes UGX and groups thousands", () => {
    expect(formatUGX(1_000_000)).toBe("UGX 1,000,000");
    expect(formatUGX(630_000)).toBe("UGX 630,000");
    expect(formatUGX(0)).toBe("UGX 0");
  });
});

describe("isValidPayAmount", () => {
  const full = 1_000_000;
  const deposit = 300_000;

  it("accepts the full amount and the minimum deposit", () => {
    expect(isValidPayAmount(full, full, deposit)).toBe(true);
    expect(isValidPayAmount(deposit, full, deposit)).toBe(true);
  });

  it("accepts any amount between the deposit and the full price", () => {
    expect(isValidPayAmount(500_000, full, deposit)).toBe(true);
  });

  it("rejects amounts below the deposit or above the full price", () => {
    expect(isValidPayAmount(100_000, full, deposit)).toBe(false);
    expect(isValidPayAmount(1_500_000, full, deposit)).toBe(false);
  });
});
