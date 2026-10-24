// Shared technical SEO helpers: enrollment metadata, JSON-LD serialisation,
// and the Course record for a published training page.

import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./site";

/** Serialize JSON-LD without letting a description close the script tag. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Checkout pages are transactional. Each one needs its own title and
 * description (the course name), and must not be indexed.
 */
export function enrollPageMetadata(course: {
  id: string;
  title: string;
}): Metadata {
  const title = `Enroll in ${course.title}`;
  const description = `Enroll in ${course.title}. Pay a deposit or in full via Mobile Money.`;
  const path = `/enroll/${course.id}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: false, follow: true },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export function courseJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  format: string;
  startDate: string;
  durationDays: number;
  seatsLeft: number;
  price: number;
}) {
  const isVirtual = input.format === "virtual";
  const description = input.description?.trim() || input.title;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.title,
    description,
    url: input.url,
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: isVirtual ? "online" : "onsite",
      startDate: input.startDate,
      courseWorkload: `P${input.durationDays}D`,
      ...(isVirtual
        ? {}
        : { location: { "@type": "Place", name: "East Africa" } }),
      offers: {
        "@type": "Offer",
        price: input.price,
        priceCurrency: "UGX",
        availability:
          input.seatsLeft > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        url: input.url,
      },
    },
  };
}
