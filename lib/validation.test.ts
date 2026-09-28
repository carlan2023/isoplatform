import { describe, it, expect } from "vitest";
import { cleanString, isUuid, isValidEmail, readJsonObject } from "./validation";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("jane@example.com")).toBe(true);
    expect(isValidEmail("  jane.doe+iso@company.co.ug ")).toBe(true);
  });

  it("rejects malformed or oversized values", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("jane")).toBe(false);
    expect(isValidEmail("jane@example")).toBe(false);
    expect(isValidEmail("jane @example.com")).toBe(false);
    expect(isValidEmail("a@b.c\nBcc: x@y.z")).toBe(false);
    expect(isValidEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });
});

describe("cleanString", () => {
  it("trims and enforces a max length", () => {
    expect(cleanString("  hi  ", 5)).toBe("hi");
    expect(cleanString("toolong", 3)).toBeNull();
  });

  it("treats null/undefined as empty and other types as invalid", () => {
    expect(cleanString(undefined, 5)).toBe("");
    expect(cleanString(null, 5)).toBe("");
    expect(cleanString(123, 5)).toBeNull();
    expect(cleanString({}, 5)).toBeNull();
  });
});

describe("isUuid", () => {
  it("validates UUIDs", () => {
    expect(isUuid("b59f3877-1c2d-4e5f-8a9b-0c1d2e3f4a5b")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});

describe("readJsonObject", () => {
  const req = (body: string) =>
    new Request("http://localhost/api", { method: "POST", body });

  it("returns the parsed object", async () => {
    expect(await readJsonObject(req('{"a":1}'))).toEqual({ a: 1 });
  });

  it("returns null for invalid JSON, arrays and primitives", async () => {
    expect(await readJsonObject(req("{nope"))).toBeNull();
    expect(await readJsonObject(req("[1,2]"))).toBeNull();
    expect(await readJsonObject(req("null"))).toBeNull();
    expect(await readJsonObject(req('"str"'))).toBeNull();
  });
});
