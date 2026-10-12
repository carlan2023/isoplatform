import { describe, it, expect } from "vitest";
import {
  pricePerPerson,
  computePricing,
  formatUGX,
  isValidPayAmount,
  isCollectableUgx,
  collectionLimitMessage,
  INDIVIDUAL_PRICE,
  TEAM_PRICE,
  TEAM_MIN_SIZE,
  MAX_TEAM_SIZE,
  INTERNAL_AUDITOR_PRICE,
  INTERNAL_AUDITOR_GROUP_PRICE,
  INTERNAL_AUDITOR_GROUP_MIN,
  MOMO_MIN_AMOUNT,
  MOMO_MAX_AMOUNT,
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

describe("Internal Auditor Courses pricing", () => {
  it("charges UGX 400,000 per person below the group threshold", () => {
    expect(pricePerPerson(1, "internal-auditor")).toBe(INTERNAL_AUDITOR_PRICE);
    expect(pricePerPerson(INTERNAL_AUDITOR_GROUP_MIN - 1, "internal-auditor")).toBe(
      INTERNAL_AUDITOR_PRICE,
    );
    expect(computePricing(4, "internal-auditor")).toEqual({
      team: 4,
      perPerson: 400_000,
      fullAmount: 1_600_000,
      minDeposit: 1_600_000,
    });
  });

  it("gives groups of 5 or more 50% off and charges the full total", () => {
    expect(INTERNAL_AUDITOR_GROUP_PRICE).toBe(200_000);
    expect(pricePerPerson(INTERNAL_AUDITOR_GROUP_MIN, "internal-auditor")).toBe(
      200_000,
    );
    const pricing = computePricing(5, "internal-auditor");
    expect(pricing).toEqual({
      team: 5,
      perPerson: 200_000,
      fullAmount: 1_000_000,
      minDeposit: 1_000_000,
    });
    expect(pricing.minDeposit).toBe(pricing.fullAmount);
    expect(computePricing(MAX_TEAM_SIZE, "internal-auditor").fullAmount).toBe(
      200_000 * MAX_TEAM_SIZE,
    );
  });

  it("keeps every allowed group size within the Mobile Money maximum", () => {
    for (let n = 1; n <= MAX_TEAM_SIZE; n += 1) {
      const { fullAmount } = computePricing(n, "internal-auditor");
      expect(fullAmount).toBeLessThanOrEqual(MOMO_MAX_AMOUNT);
      expect(isCollectableUgx(fullAmount)).toBe(true);
      expect(collectionLimitMessage(fullAmount)).toBeNull();
    }
    expect(computePricing(10, "internal-auditor").fullAmount).toBe(2_000_000);
  });

  it("uses the same team-size clamp as other courses", () => {
    expect(computePricing(0, "internal-auditor").team).toBe(1);
    expect(computePricing(999, "internal-auditor").team).toBe(MAX_TEAM_SIZE);
  });

  it("leaves lead-auditor pricing unchanged when the product is omitted", () => {
    expect(computePricing(1).perPerson).toBe(INDIVIDUAL_PRICE);
    expect(pricePerPerson(TEAM_MIN_SIZE)).toBe(TEAM_PRICE);
  });
});

describe("isCollectableUgx", () => {
  it("accepts whole shillings from 500 through 7,000,000", () => {
    expect(isCollectableUgx(MOMO_MIN_AMOUNT)).toBe(true);
    expect(isCollectableUgx(MOMO_MAX_AMOUNT)).toBe(true);
    expect(isCollectableUgx(400_000)).toBe(true);
    expect(isCollectableUgx(2_000_000)).toBe(true);
  });

  it("rejects fractions, amounts under 500, and amounts over 7,000,000", () => {
    expect(isCollectableUgx(499)).toBe(false);
    expect(isCollectableUgx(MOMO_MAX_AMOUNT + 1)).toBe(false);
    expect(isCollectableUgx(1000.5)).toBe(false);
    expect(isCollectableUgx(0)).toBe(false);
    expect(isCollectableUgx(-400_000)).toBe(false);
  });
});

describe("collectionLimitMessage", () => {
  it("is quiet when the total can be collected", () => {
    expect(collectionLimitMessage(2_000_000)).toBeNull();
    expect(collectionLimitMessage(MOMO_MAX_AMOUNT)).toBeNull();
  });

  it("explains a total above the Mobile Money maximum", () => {
    const message = collectionLimitMessage(MOMO_MAX_AMOUNT + 200_000);
    expect(message).toBe(
      "This total of UGX 7,200,000 is above the Mobile Money limit of UGX 7,000,000. Choose fewer participants, or contact NAM QMS to arrange this booking.",
    );
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
