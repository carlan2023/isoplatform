import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { STANDARDS } from "./standards";
import { UGANDA_ISO_PAGES } from "./uganda-iso";

function source(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

const OVERLAPPING = [
  ["iso-9001", "/iso-9001-certification-uganda"],
  ["iso-14001", "/iso-14001-certification-uganda"],
  ["iso-27001", "/iso-27001-certification-uganda"],
  ["iso-45001", "/iso-45001-certification-uganda"],
] as const;

describe("distinct search intent", () => {
  it("keeps consulting pages off the Uganda certification queries", () => {
    for (const [slug, guidePath] of OVERLAPPING) {
      const standard = STANDARDS.find((item) => item.slug === slug);
      const guide = UGANDA_ISO_PAGES.find((item) => item.path === guidePath);
      expect(standard, slug).toBeDefined();
      expect(guide, guidePath).toBeDefined();
      expect(standard!.metaTitle.toLowerCase()).not.toContain(guide!.query);
      expect(standard!.heading.toLowerCase()).not.toContain(guide!.query);
      expect(standard!.metaTitle).not.toBe(guide!.metaTitle);
      expect(standard!.heading.toLowerCase()).toMatch(/implementation/);
      expect(standard!.heading.toLowerCase()).toMatch(/organisations/);
    }
  });

  it("points consulting pages at individual courses and the readiness guides", () => {
    const page = source("app/certifications/[slug]/page.tsx");
    expect(page).toMatch(/Implementation is for organisations and is quoted/);
    expect(page).toMatch(/Training is for individuals/);
    expect(page).toContain('canonical: path');
    expect(page).toContain("INDIVIDUAL_COURSES");
    expect(page).toContain("ugandaGuide.path");
  });

  it("splits internal audit implementation from the individual course", () => {
    const organisation = source("app/internal-audit-training/page.tsx");
    const course = source("app/internal-auditor-courses/page.tsx");
    expect(organisation).toContain(
      "Internal audit implementation for organisations",
    );
    expect(organisation).toContain('canonical: "/internal-audit-training"');
    expect(organisation).toContain('href="/internal-auditor-courses"');
    expect(organisation).toMatch(/Implementation for an organisation is quoted/);
    expect(organisation).not.toMatch(/UGX\s*[0-9]/);
    expect(course).toContain("Internal Auditor Course for Individuals");
    expect(course).toContain('href="/internal-audit-training"');
    expect(course).toMatch(/Training is for individuals/);
    expect(course).toContain("INTERNAL_AUDITOR_PRICE");
    expect(course).toContain("INTERNAL_AUDITOR_GROUP_PRICE");
    expect(course).toContain("alternates: { canonical:");
  });
});
