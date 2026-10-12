import { describe, expect, it } from "vitest";
import {
  evaluatePassword,
  isPasswordValid,
  passwordValidationError,
} from "./password";

describe("password rules", () => {
  it("accepts a password that meets every rule", () => {
    expect(isPasswordValid("Supabase1")).toBe(true);
    expect(passwordValidationError("Supabase1", "Supabase1")).toBeNull();
  });

  it("requires length, mixed case, and a number", () => {
    expect(isPasswordValid("Ab1")).toBe(false);
    expect(isPasswordValid("longpassword1")).toBe(false);
    expect(isPasswordValid("LongPassword")).toBe(false);
    expect(passwordValidationError("longpassword1", "longpassword1")).toBe(
      "Please choose a password that meets all the requirements.",
    );
  });

  it("requires the confirmation to match", () => {
    expect(passwordValidationError("Supabase1", "Supabase2")).toBe(
      "Passwords do not match.",
    );
    expect(passwordValidationError("Supabase1", "")).toBe(
      "Passwords do not match.",
    );
  });

  it("reports the checklist per rule", () => {
    const checks = evaluatePassword("abcdefgh");
    expect(checks.map((check) => [check.label, check.ok])).toEqual([
      ["At least 8 characters", true],
      ["Upper and lowercase letters", false],
      ["At least one number", false],
    ]);
  });
});
