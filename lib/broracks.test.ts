import { describe, expect, it } from "vitest";
import { providerMessageFrom } from "./broracks";

describe("providerMessageFrom", () => {
  it("reads a top-level message from a JSON string", () => {
    expect(providerMessageFrom('{"message":"Invalid phone number"}')).toBe(
      "Invalid phone number",
    );
  });

  it("reads nested error messages", () => {
    expect(providerMessageFrom({ error: { message: "Limit exceeded" } })).toBe(
      "Limit exceeded",
    );
    expect(providerMessageFrom({ error: "Unsupported network" })).toBe(
      "Unsupported network",
    );
  });

  it("returns plain text but never HTML error pages", () => {
    expect(providerMessageFrom("Bad Request")).toBe("Bad Request");
    expect(providerMessageFrom("<!DOCTYPE html><html>502</html>")).toBeNull();
  });

  it("returns null when there is nothing usable", () => {
    expect(providerMessageFrom("")).toBeNull();
    expect(providerMessageFrom({ success: false })).toBeNull();
    expect(providerMessageFrom(null)).toBeNull();
  });

  it("caps very long messages", () => {
    expect(providerMessageFrom({ message: "x".repeat(500) })?.length).toBe(200);
  });
});
