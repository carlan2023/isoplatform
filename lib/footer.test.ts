import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("footer", () => {
  const footer = source("app/components/Footer.tsx");

  it("uses the original logo file on a light chip", () => {
    expect(footer).toContain('src="/nam-qms-logo.png"');
    expect(footer).toContain("bg-white");
    expect(footer).not.toContain("ShieldCheck");
  });

  it("links privacy and terms to pages on this site", () => {
    expect(footer).toContain('href: "/privacy"');
    expect(footer).toContain('href: "/terms"');
    expect(footer).toContain("LEGAL_NAME");
    expect(footer).toContain("CONTACT.email");
    expect(footer).toContain("CONTACT.phoneDisplay");
    expect(footer).toContain("CONTACT.location");
    expect(footer).toContain("new Date().getFullYear()");
  });
});

describe("privacy policy page", () => {
  const page = source("app/privacy/page.tsx");

  it("is dated 15 October 2026 and covers the data the site actually collects", () => {
    expect(page).toContain("20 October 2026");
    expect(page).toContain("Data Protection and Privacy Act, 2019");
    expect(page).toContain("Broracks");
    expect(page).toContain("HubSpot");
    expect(page).toMatch(/analytics cookies/i);
    expect(page).toContain("CONTACT.email");
    expect(page).toContain("CONTACT.phoneDisplay");
    expect(page).toContain("CONTACT.location");
    expect(page).not.toMatch(/\bIQS\b/);
    expect(page).not.toMatch(/AM Quality Systems|AMQMS|(?<![A-Za-z])AM\s*QMS\b/);
  });
});
