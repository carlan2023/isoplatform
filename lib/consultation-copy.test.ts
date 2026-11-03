import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import {
  FREE_CONSULTATION_PATH,
  LEGACY_FREE_GAP_ANALYSIS_PATH,
} from "./site";

const FORBIDDEN = [
  /free iso gap analysis/i,
  /free gap analysis/i,
  /free initial assessment/i,
  /hs-sites-eu1\.com\/free-iso-gap-analysis/,
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(tsx?|txt|md)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("free consultation wording", () => {
  it("does not keep the old free-offer names in public copy", () => {
    const files = [
      ...walk(path.join(process.cwd(), "app")),
      ...walk(path.join(process.cwd(), "lib")),
      ...walk(path.join(process.cwd(), "public")),
      path.join(process.cwd(), "next.config.ts"),
    ];
    const hits: string[] = [];
    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      const text = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) {
          hits.push(`${path.relative(process.cwd(), file)} ${pattern}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("keeps the old path only as a permanent redirect", async () => {
    expect(nextConfig.redirects).toBeTypeOf("function");
    const redirects = await nextConfig.redirects!();
    expect(redirects).toContainEqual({
      source: LEGACY_FREE_GAP_ANALYSIS_PATH,
      destination: FREE_CONSULTATION_PATH,
      permanent: true,
    });

    const allowed = new Set([
      path.normalize("lib/site.ts"),
      path.normalize("next.config.ts"),
    ]);
    const files = [
      ...walk(path.join(process.cwd(), "app")),
      ...walk(path.join(process.cwd(), "lib")),
      ...walk(path.join(process.cwd(), "public")),
      path.join(process.cwd(), "next.config.ts"),
    ];
    const hits: string[] = [];
    for (const file of files) {
      if (file.endsWith(".test.ts")) continue;
      const relative = path.relative(process.cwd(), file);
      if (allowed.has(path.normalize(relative))) continue;
      const text = readFileSync(file, "utf8");
      if (text.includes(LEGACY_FREE_GAP_ANALYSIS_PATH)) hits.push(relative);
    }
    expect(hits).toEqual([]);
    expect(FREE_CONSULTATION_PATH).toBe("/free-consultation");
  });
});
