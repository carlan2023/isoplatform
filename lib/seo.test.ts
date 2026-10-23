import { describe, expect, it } from "vitest";
import { courseJsonLd, enrollPageMetadata, jsonLdHtml } from "./seo";
import { SITE_NAME } from "./site";

describe("enrollPageMetadata", () => {
  const iso9001 = enrollPageMetadata({
    id: "course-9001",
    title: "ISO 9001:2015 Lead Auditor",
  });
  const iso14001 = enrollPageMetadata({
    id: "course-14001",
    title: "ISO 14001:2015 Lead Auditor",
  });

  it("gives each checkout page its own title and description", () => {
    expect(iso9001.title).toBe("Enroll in ISO 9001:2015 Lead Auditor");
    expect(iso14001.title).toBe("Enroll in ISO 14001:2015 Lead Auditor");
    expect(iso9001.title).not.toBe(iso14001.title);
    expect(iso9001.description).toContain("ISO 9001:2015 Lead Auditor");
    expect(iso14001.description).toContain("ISO 14001:2015 Lead Auditor");
    expect(iso9001.description).not.toBe(iso14001.description);
  });

  it("marks checkout pages noindex and canonical to themselves", () => {
    expect(iso9001.robots).toEqual({ index: false, follow: true });
    expect(iso9001.alternates).toEqual({ canonical: "/enroll/course-9001" });
    expect(iso9001.openGraph).toMatchObject({
      title: `Enroll in ISO 9001:2015 Lead Auditor | ${SITE_NAME}`,
      url: "/enroll/course-9001",
    });
  });

  it("does not reuse the homepage description or claim to certify", () => {
    expect(iso9001.description).not.toMatch(/get your business/i);
    expect(iso9001.description).not.toMatch(/\bcertif(y|ies|ied)\b/i);
    expect(String(iso9001.title).length + ` | ${SITE_NAME}`.length).toBeLessThanOrEqual(60);
  });
});

describe("courseJsonLd", () => {
  it("uses the provider url and always includes a description", () => {
    const ld = courseJsonLd({
      title: "ISO 9001:2015 Lead Auditor",
      description: "   ",
      url: "https://www.amqualitysystems.com/courses/iso-9001-2015-lead-auditor",
      format: "in-person",
      startDate: "2026-11-02",
      durationDays: 5,
      seatsLeft: 4,
      price: 1000000,
    });
    expect(ld.description).toBe("ISO 9001:2015 Lead Auditor");
    expect(ld.provider).toEqual({
      "@type": "Organization",
      "@id": "https://www.amqualitysystems.com/#organization",
      name: "NAM QMS",
      url: "https://www.amqualitysystems.com",
    });
    expect(ld.provider).not.toHaveProperty("sameAs");
    expect(ld.hasCourseInstance.courseMode).toBe("onsite");
    expect(ld.hasCourseInstance.location).toEqual({
      "@type": "Place",
      name: "East Africa",
    });
  });

  it("omits a place for virtual courses", () => {
    const ld = courseJsonLd({
      title: "ISO 27001:2022 Lead Auditor",
      description: "Information security lead auditor training.",
      url: "https://www.amqualitysystems.com/courses/iso-27001-2022-lead-auditor",
      format: "virtual",
      startDate: "2026-11-02",
      durationDays: 5,
      seatsLeft: 0,
      price: 1000000,
    });
    expect(ld.hasCourseInstance.courseMode).toBe("online");
    expect(ld.hasCourseInstance).not.toHaveProperty("location");
    expect(ld.hasCourseInstance.offers.availability).toBe(
      "https://schema.org/SoldOut",
    );
  });
});

describe("jsonLdHtml", () => {
  it("escapes angle brackets", () => {
    expect(jsonLdHtml({ name: "</script><script>" })).not.toContain("</");
    expect(jsonLdHtml({ name: "a < b" })).toContain("\\u003c");
  });
});
