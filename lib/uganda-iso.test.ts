import { describe, expect, it } from "vitest";
import { courseSlug } from "./course-slug";
import {
  GAP_ANALYSIS_URL,
  LEAD_AUDITOR_COURSE_PAGES,
  UGANDA_ISO_PAGES,
  organizationJsonLd,
  ugandaIsoHeadings,
  ugandaIsoJsonLd,
  ugandaIsoPageForCourse,
  ugandaIsoPageForStandardSlug,
  ugandaIsoPlainText,
  ugandaIsoSitemapPaths,
  ugandaIsoWordCount,
} from "./uganda-iso";

const REQUIRED_QUERIES = [
  "iso 27001 certification in uganda",
  "iso 14001 certification in uganda",
  "iso 45001 lead auditor course",
  "iso 13485 certification in uganda",
  "iso certification in uganda",
  "iso 9001 certification in uganda",
  "iso 42001 certification in uganda",
];

const FORBIDDEN = [
  /\bIQS\b/,
  /(?<![A-Za-z])AM\s*QMS\b/i,
  /\bAMQMS\b/i,
  /AM Quality Systems/i,
  /\bUGX\b/,
  /\bExemplar\b/i,
  /\bIRCA\b/,
];

describe("Uganda ISO landing pages", () => {
  it("publishes the hub and six standard pages", () => {
    expect(ugandaIsoSitemapPaths()).toEqual([
      "/iso-certification-uganda",
      "/iso-9001-certification-uganda",
      "/iso-14001-certification-uganda",
      "/iso-27001-certification-uganda",
      "/iso-45001-certification-uganda",
      "/iso-13485-certification-uganda",
      "/iso-42001-certification-uganda",
    ]);
  });

  it("keeps titles, descriptions and paths unique", () => {
    const titles = UGANDA_ISO_PAGES.map((page) => page.metaTitle);
    const descriptions = UGANDA_ISO_PAGES.map((page) => page.metaDescription);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const page of UGANDA_ISO_PAGES) {
      expect(page.metaTitle.length).toBeGreaterThan(20);
      expect(page.metaDescription.length).toBeGreaterThan(80);
      expect(page.metaDescription.length).toBeLessThanOrEqual(170);
      expect(page.gapAnalysisHref).toBe(GAP_ANALYSIS_URL);
    }
  });

  it("embeds each required query in a heading and in the body", () => {
    for (const query of REQUIRED_QUERIES) {
      const page = UGANDA_ISO_PAGES.find((item) => item.query === query);
      expect(page, query).toBeDefined();
      const body = ugandaIsoPlainText(page!).toLowerCase();
      expect(ugandaIsoHeadings(page!).includes(query)).toBe(true);
      expect(body.includes(query)).toBe(true);
    }
  });

  it("stays in the readable word range with genuine FAQs", () => {
    for (const page of UGANDA_ISO_PAGES) {
      const words = ugandaIsoWordCount(page);
      expect(words, page.path).toBeGreaterThanOrEqual(600);
      expect(words, page.path).toBeLessThanOrEqual(900);
      expect(page.faqs.length).toBeGreaterThanOrEqual(4);
      expect(page.faqs.length).toBeLessThanOrEqual(6);
    }
  });

  it("does not claim NAM QMS certifies organisations or invent commercial facts", () => {
    for (const page of UGANDA_ISO_PAGES) {
      const text = ugandaIsoPlainText(page);
      for (const pattern of FORBIDDEN) {
        expect(text, `${page.path} ${pattern}`).not.toMatch(pattern);
      }
      expect(text).toMatch(/not a certification body/i);
      expect(text).toMatch(/does not issue/i);
      expect(page.image.alt.length).toBeGreaterThan(20);
    }
  });

  it("emits Organization, Service, FAQ and breadcrumb JSON-LD", () => {
    for (const page of UGANDA_ISO_PAGES) {
      const ld = ugandaIsoJsonLd(page);
      expect(ld.organization["@type"]).toBe("Organization");
      expect(ld.organization.name).toBe("NAM QMS");
      expect(organizationJsonLd().name).toBe("NAM QMS");
      expect(ld.service["@type"]).toBe("Service");
      expect(ld.service.audience.audienceType).toMatch(/organisations/i);
      expect(ld.faq["@type"]).toBe("FAQPage");
      expect(ld.faq.mainEntity).toHaveLength(page.faqs.length);
      expect(ld.breadcrumb["@type"]).toBe("BreadcrumbList");
      const positions = ld.breadcrumb.itemListElement.map((item) => item.position);
      expect(positions).toEqual(
        page.kind === "hub" ? [1, 2] : [1, 2, 3],
      );
    }
  });

  it("points Lead Auditor fees at the published course slugs", () => {
    expect(LEAD_AUDITOR_COURSE_PAGES.iso9001.path).toBe(
      `/courses/${courseSlug("ISO 9001:2015 Lead Auditor")}`,
    );
    expect(LEAD_AUDITOR_COURSE_PAGES.iso14001.path).toBe(
      "/courses/iso-14001-2015-lead-auditor",
    );
    expect(LEAD_AUDITOR_COURSE_PAGES.iso27001.path).toBe(
      "/courses/iso-27001-2022-lead-auditor",
    );
    expect(LEAD_AUDITOR_COURSE_PAGES.iso45001.path).toBe(
      "/courses/iso-45001-2018-lead-auditor",
    );
  });

  it("does not describe the ISO 13485 page as an ISO 9001 Lead Auditor course", () => {
    const page = UGANDA_ISO_PAGES.find(
      (item) => item.path === "/iso-13485-certification-uganda",
    );
    expect(page).toBeDefined();
    const paragraphs = page!.sections.flatMap((section) => section.paragraphs);
    const text = ugandaIsoPlainText(page!);
    expect(text).not.toMatch(/Lead Auditor/i);
    expect(text).not.toMatch(/ISO 9001:2015/);
    expect(paragraphs.join("\n")).not.toContain("${");
    expect(paragraphs.join("\n")).toContain(
      "[[/internal-auditor-courses|Internal Auditor Courses page]]",
    );
    expect(text).toMatch(/Training is for individuals/i);
    expect(text).toMatch(/Implementation is for organisations and is quoted/i);
  });

  it("links a course page to the matching organisational guide", () => {
    expect(
      ugandaIsoPageForCourse({
        title: "ISO 45001:2018 Lead Auditor",
        standard: "ISO 45001",
      }).path,
    ).toBe("/iso-45001-certification-uganda");
    expect(
      ugandaIsoPageForCourse({
        title: "ISO 22000: Lead Auditor",
        standard: "ISO 22000",
      }).path,
    ).toBe("/iso-certification-uganda");
    expect(ugandaIsoPageForStandardSlug("iso-13485")?.path).toBe(
      "/iso-13485-certification-uganda",
    );
    expect(ugandaIsoPageForStandardSlug("iso-22000")).toBeUndefined();
  });
});
