import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PECB_FAQS,
  PECB_META_DESCRIPTION,
  PECB_META_TITLE,
  PECB_TRADEMARK_NOTICE,
  PECB_TRAINING_PATH,
  pecbPageJsonLd,
  pecbPublicText,
} from "./pecb";

function source(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

const PAGE_FILES = [
  "lib/pecb.ts",
  "app/pecb-training-uganda/page.tsx",
];

const FORBIDDEN = [
  /(?<![A-Za-z])AM\s*QMS\b/i,
  /\bAMQMS\b/i,
  /AM Quality Systems/i,
  /\bIRCA\b/,
  /\bExemplar\b/i,
  /free gap analysis/i,
  /free initial assessment/i,
  /\bUGX\b/,
  /\$\s?\d/,
  /ISO logo/i,
  /accreditation logo/i,
  /pecb[-_ ]?logo/i,
  /NAM QMS is accredited/i,
  /we are accredited/i,
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
];

describe("PECB partner page", () => {
  it("publishes the draft URL, title, description and trademark notice", () => {
    expect(PECB_TRAINING_PATH).toBe("/pecb-training-uganda");
    expect(PECB_META_TITLE).toBe(
      "PECB Training in Uganda, Africa & Middle East | NAM QMS",
    );
    expect(PECB_META_DESCRIPTION).toContain("Authorized Training Reseller");
    expect(PECB_META_DESCRIPTION).toContain("Request a quote");
    expect(PECB_META_DESCRIPTION).not.toMatch(/\d{2,}/);
    expect(PECB_TRADEMARK_NOTICE).toBe(
      "PECB is a registered trademark of the PECB Group and is used under license. NAM QMS is an independent training provider; this is not a PECB website.",
    );
  });

  it("calls NAM QMS a PECB partner and keeps pricing by quote", () => {
    const text = pecbPublicText();
    expect(text).toMatch(/PECB partner/);
    expect(text).toMatch(/Authorized Training Reseller/);
    expect(text).toMatch(/Pricing is by quote/);
    expect(text).toMatch(/does not certify or accredit/);
    expect(text).toMatch(/Exams and certification are run by PECB/);
    expect(PECB_FAQS).toHaveLength(8);
  });

  it("emits Service, FAQPage and breadcrumb JSON-LD without a price", () => {
    const ld = pecbPageJsonLd();
    expect(ld.service["@type"]).toBe("Service");
    expect(ld.service.provider.name).toBe("NAM QMS");
    expect(ld.service.url).toMatch(/\/pecb-training-uganda$/);
    expect(ld.service).not.toHaveProperty("offers");
    expect(ld.faq["@type"]).toBe("FAQPage");
    expect(ld.faq.mainEntity).toHaveLength(PECB_FAQS.length);
    expect(ld.faq.mainEntity[0].acceptedAnswer.text).toBe(PECB_FAQS[0].a);
    expect(ld.breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(ld.breadcrumb.itemListElement.map((item) => item.position)).toEqual([
      1, 2,
    ]);
    expect(JSON.stringify(ld)).not.toMatch(/"price"/);
    expect(JSON.stringify(ld)).not.toMatch(/\bIRCA\b|\bExemplar\b/i);
  });

  it("keeps the page and its copy inside the partnership rules", () => {
    const page = source("app/pecb-training-uganda/page.tsx");
    expect(page).toContain("PECB_TRADEMARK_NOTICE");
    expect(page).toContain('canonical: PECB_TRAINING_PATH');
    expect(page).toContain("pecbPageJsonLd");
    expect(page).not.toMatch(/<img[^>]+pecb/i);
    expect(page).not.toMatch(/src=.*logo/i);
    for (const file of PAGE_FILES) {
      const text = source(file);
      for (const pattern of FORBIDDEN) {
        expect(text, `${file} ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("is linked from navigation, training pages, the sitemap and llms.txt", () => {
    for (const file of [
      "app/sitemap.ts",
      "app/components/SiteNav.tsx",
      "app/components/Footer.tsx",
      "app/page.tsx",
      "app/internal-audit-training/page.tsx",
      "app/internal-auditor-courses/page.tsx",
      "public/llms.txt",
    ]) {
      expect(source(file), file).toContain(
        file.endsWith("llms.txt") ? PECB_TRAINING_PATH : "PECB_TRAINING_PATH",
      );
    }
    expect(source("public/llms.txt")).toContain(PECB_TRAINING_PATH);
    expect(source("public/llms.txt")).toMatch(/PECB partner/);
  });
});
