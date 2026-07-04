// Executable BDD specification for the enrollment journey.
// Mirrors features/enrollment.feature, exercising the real domain logic
// (Given / When / Then). Pure functions only — no DB or network.
import { describe, it, expect } from "vitest";
import { computePricing, formatUGX, isValidPayAmount } from "../lib/pricing";
import { canReserveSeat, nextSeatNumber } from "../lib/seats";
import { shouldConfirmPayment } from "../lib/webhook";

describe("Feature: Course enrollment and Mobile Money payment", () => {
  describe("Scenario: An individual sees the standard price and deposit", () => {
    it("When 1 participant prices a booking, Then full is UGX 1,000,000 and deposit UGX 300,000", () => {
      const { fullAmount, minDeposit } = computePricing(1);
      expect(formatUGX(fullAmount)).toBe("UGX 1,000,000");
      expect(formatUGX(minDeposit)).toBe("UGX 300,000");
    });
  });

  describe("Scenario: Teams of three or more get the discounted rate", () => {
    it("When 3 participants price a booking, Then full is UGX 2,100,000 and deposit UGX 630,000", () => {
      const { fullAmount, minDeposit } = computePricing(3);
      expect(formatUGX(fullAmount)).toBe("UGX 2,100,000");
      expect(formatUGX(minDeposit)).toBe("UGX 630,000");
    });
  });

  describe("Scenario: A deposit is an acceptable first payment", () => {
    const full = 1_000_000;
    const deposit = 300_000;

    it("Given a booking, Then deposit/partial/full are accepted and under/over are rejected", () => {
      expect(isValidPayAmount(deposit, full, deposit)).toBe(true);
      expect(isValidPayAmount(600_000, full, deposit)).toBe(true);
      expect(isValidPayAmount(100_000, full, deposit)).toBe(false);
      expect(isValidPayAmount(1_500_000, full, deposit)).toBe(false);
    });
  });

  describe("Scenario: Seats are reserved up to capacity, then the course is full", () => {
    it("Given 2 seats, Then two reservations succeed (seats 1 and 2) and the third is rejected", () => {
      const total = 2;
      let held = 0;

      expect(canReserveSeat(held, total)).toBe(true);
      expect(nextSeatNumber(held)).toBe(1);
      held += 1;

      expect(canReserveSeat(held, total)).toBe(true);
      expect(nextSeatNumber(held)).toBe(2);
      held += 1;

      expect(canReserveSeat(held, total)).toBe(false);
    });
  });

  describe("Scenario: A payment is only confirmed for the right amount", () => {
    it("Given an enrollment owing 300,000, Then an exact collection confirms it and an underpayment does not", () => {
      expect(shouldConfirmPayment(300_000, 300_000)).toBe(true);
      expect(shouldConfirmPayment(100_000, 300_000)).toBe(false);
    });
  });
});
