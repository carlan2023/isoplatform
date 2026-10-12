import { describe, expect, it } from "vitest";
import {
  isGroupHoneypotTripped,
  validateGroupEnrollment,
  GROUP_HONEYPOT_FIELD,
} from "./group-enrollment";
import { MAX_TEAM_SIZE } from "./pricing";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "Acme Ltd",
    contactName: "Amina Nakato",
    contactEmail: "amina@acme.example",
    momoPhone: "0771234567",
    teamSize: 1,
    fullAmount: 400_000,
    participants: [{ name: "Amina Nakato", email: "amina@acme.example" }],
    ...overrides,
  };
}

describe("validateGroupEnrollment", () => {
  it("prices one participant at UGX 400,000 and normalises the phone", () => {
    const result = validateGroupEnrollment(payload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fullAmount).toBe(400_000);
    expect(result.data.perPerson).toBe(400_000);
    expect(result.data.momoPhone).toBe("+256771234567");
    expect(result.data.contactEmail).toBe("amina@acme.example");
  });

  it("charges UGX 200,000 per person for a group of five", () => {
    const participants = Array.from({ length: 5 }, (_, i) => ({
      name: `Person ${i + 1}`,
      email: `person${i + 1}@acme.example`,
    }));
    const result = validateGroupEnrollment(
      payload({ teamSize: 5, fullAmount: 1_000_000, participants }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.perPerson).toBe(200_000);
    expect(result.data.fullAmount).toBe(1_000_000);
    expect(result.data.participantCount).toBe(5);
  });

  it("keeps the list price for four participants", () => {
    const participants = Array.from({ length: 4 }, (_, i) => ({
      name: `Person ${i + 1}`,
      email: `person${i + 1}@acme.example`,
    }));
    const result = validateGroupEnrollment(
      payload({ teamSize: 4, fullAmount: 1_600_000, participants }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fullAmount).toBe(1_600_000);
  });

  it("rejects a team larger than MAX_TEAM_SIZE", () => {
    const result = validateGroupEnrollment(payload({ teamSize: MAX_TEAM_SIZE + 1 }));
    expect(result.ok).toBe(false);
  });

  it("rejects a displayed total that does not match the server price", () => {
    const result = validateGroupEnrollment(payload({ fullAmount: 200_000 }));
    expect(result).toEqual({
      ok: false,
      error: "Prices have changed since this page loaded. Please refresh and try again.",
    });
  });

  it("requires a name and email for every participant", () => {
    const result = validateGroupEnrollment(
      payload({
        teamSize: 2,
        fullAmount: 800_000,
        participants: [{ name: "Amina Nakato", email: "amina@acme.example" }],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/every participant/i);
  });

  it("rejects duplicate participant emails", () => {
    const result = validateGroupEnrollment(
      payload({
        teamSize: 2,
        fullAmount: 800_000,
        participants: [
          { name: "Amina Nakato", email: "shared@acme.example" },
          { name: "John Okello", email: "Shared@acme.example" },
        ],
      }),
    );
    expect(result).toEqual({
      ok: false,
      error: "Each participant needs their own email address.",
    });
  });

  it("rejects an invalid Mobile Money number", () => {
    const result = validateGroupEnrollment(payload({ momoPhone: "12345" }));
    expect(result.ok).toBe(false);
  });
});

describe("isGroupHoneypotTripped", () => {
  it("is false when the hidden field is empty", () => {
    expect(isGroupHoneypotTripped({ [GROUP_HONEYPOT_FIELD]: "  " })).toBe(false);
    expect(isGroupHoneypotTripped({})).toBe(false);
  });

  it("is true when the hidden field has a value", () => {
    expect(isGroupHoneypotTripped({ [GROUP_HONEYPOT_FIELD]: "https://spam.example" })).toBe(
      true,
    );
  });
});
