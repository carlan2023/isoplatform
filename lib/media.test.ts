import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OG_IMAGE } from "./media";

describe("OG_IMAGE", () => {
  it("points at a real 1200×630 PNG", () => {
    expect(OG_IMAGE.src).toBe("/og-image.png");
    expect(OG_IMAGE.width).toBe(1200);
    expect(OG_IMAGE.height).toBe(630);
    const png = readFileSync(path.join(process.cwd(), "public/og-image.png"));
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
