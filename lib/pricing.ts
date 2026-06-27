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

/** Per-person price for a given team size. */
export function pricePerPerson(teamSize: number): number {
  return teamSize >= TEAM_MIN_SIZE ? TEAM_PRICE : INDIVIDUAL_PRICE;
}

/**
 * Canonical pricing for a booking. Clamps team size to the allowed range and
 * returns the per-person rate, the full amount, and the minimum deposit.
 */
export function computePricing(teamSize: number) {
  const team = Math.min(MAX_TEAM_SIZE, Math.max(1, Math.floor(teamSize) || 1));
  const perPerson = pricePerPerson(team);
  const fullAmount = perPerson * team;
  const minDeposit = Math.ceil(fullAmount * DEPOSIT_RATE);
  return { team, perPerson, fullAmount, minDeposit };
}

/** Format a UGX amount for display, e.g. 1000000 -> "UGX 1,000,000". */
export function formatUGX(amount: number): string {
  return `UGX ${Math.round(amount).toLocaleString()}`;
}
