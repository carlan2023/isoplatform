import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FORBIDDEN = [
  /(?<![A-Za-z])AM\s*QMS\b/i,
  /\bAMQMS\b/i,
  /AM Quality Systems/i,
];

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".css",
  ".md",
  ".svg",
  ".json",
  ".html",
  ".webmanifest",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (TEXT_EXT.has(path.extname(entry))) out.push(full);
  }
  return out;
}

describe("brand name", () => {
  it("does not use AM QMS, AMQMS, or AM Quality Systems in source", () => {
    const files = [
      ...walk(path.join(process.cwd(), "app")),
      ...walk(path.join(process.cwd(), "lib")),
      ...walk(path.join(process.cwd(), "public")),
    ];
    const hits: string[] = [];
    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      const text = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) hits.push(`${path.relative(process.cwd(), file)} ${pattern}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
