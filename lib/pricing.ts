// ---------------------------------------------------------------------------
// Pricing — the single source of truth for course costs.
//
// Every price shown to a user and every amount charged must come from here.
// Do NOT re-declare these numbers in components, routes, or pages; import them.
// All amounts are in UGX (whole shillings).
// ---------------------------------------------------------------------------

export const INDIVIDUAL_PRICE = 1_000_000; // per person
export const TEAM_PRICE = 700_000; // per person, for teams of TEAM_MIN_SIZE+
export const TEAM_MIN_SIZE = 3;
export const MAX_TEAM_SIZE = 10;
export const DEPOSIT_RATE = 0.3; // minimum deposit = 30% of the full amount

/** Internal Auditor Courses — list price per person. */
export const INTERNAL_AUDITOR_PRICE = 40_000;
/** Groups of this size or larger pay half. */
export const INTERNAL_AUDITOR_GROUP_MIN = 5;
/** 50% of INTERNAL_AUDITOR_PRICE. */
export const INTERNAL_AUDITOR_GROUP_PRICE = INTERNAL_AUDITOR_PRICE / 2;

/**
 * BroRacks Mobile Money collects whole Uganda shillings in this inclusive
 * range. Every charge must pass isCollectableUgx before it is sent.
 */
export const MOMO_MIN_AMOUNT = 500;
export const MOMO_MAX_AMOUNT = 7_000_000;

export const PRICING_PRODUCTS = ["lead-auditor", "internal-auditor"] as const;
export type PricingProduct = (typeof PRICING_PRODUCTS)[number];

/** True when `amount` is a whole number of UGX BroRacks can collect. */
export function isCollectableUgx(amount: number): boolean {
  return (
    Number.isInteger(amount) &&
    amount >= MOMO_MIN_AMOUNT &&
    amount <= MOMO_MAX_AMOUNT
  );
}

/** Per-person price for a given team size and product. */
export function pricePerPerson(
  teamSize: number,
  product: PricingProduct = "lead-auditor",
): number {
  if (product === "internal-auditor") {
    return teamSize >= INTERNAL_AUDITOR_GROUP_MIN
      ? INTERNAL_AUDITOR_GROUP_PRICE
      : INTERNAL_AUDITOR_PRICE;
  }
  return teamSize >= TEAM_MIN_SIZE ? TEAM_PRICE : INDIVIDUAL_PRICE;
}

/**
 * Canonical pricing for a booking. Clamps team size to 1..MAX_TEAM_SIZE and
 * returns the per-person rate, the full amount, and the minimum due now.
 *
 * Lead Auditor courses keep the 30% deposit. Internal Auditor Courses charge
 * the full total (groups of INTERNAL_AUDITOR_GROUP_MIN or more are half price).
 */
export function computePricing(
  teamSize: number,
  product: PricingProduct = "lead-auditor",
) {
  const team = Math.min(MAX_TEAM_SIZE, Math.max(1, Math.floor(teamSize) || 1));
  const perPerson = pricePerPerson(team, product);
  const fullAmount = perPerson * team;
  const minDeposit =
    product === "internal-auditor"
      ? fullAmount
      : Math.ceil(fullAmount * DEPOSIT_RATE);
  return { team, perPerson, fullAmount, minDeposit };
}

/** Format a UGX amount for display, e.g. 1000000 -> "UGX 1,000,000". */
export function formatUGX(amount: number): string {
  return `UGX ${Math.round(amount).toLocaleString()}`;
}

/**
 * Whether a "pay now" amount is acceptable for a booking: anything from the
 * minimum deposit up to (and including) the full amount — never below the
 * deposit or above the full amount.
 */
export function isValidPayAmount(
  amount: number,
  fullAmount: number,
  minDeposit: number,
): boolean {
  return amount >= minDeposit && amount <= fullAmount;
}
