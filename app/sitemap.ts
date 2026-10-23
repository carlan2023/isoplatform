import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { INTERNAL_AUDITOR_ENROLL_PATH } from "@/lib/group-enrollment";
import { abs } from "@/lib/site";
import { STANDARDS } from "@/lib/standards";
import { coursePath } from "@/lib/course-slug";
import { UGANDA_ISO_HUB_PATH, ugandaIsoSitemapPaths } from "@/lib/uganda-iso";

// Regenerate alongside the ISR pages so newly published courses appear.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: abs("/"), changeFrequency: "weekly", priority: 1 },
    // Primary business conversion page (certification application form).
    { url: abs("/apply"), changeFrequency: "monthly", priority: 0.9 },
    {
      url: abs("/iso-certification-consulting"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...ugandaIsoSitemapPaths().map((path) => ({
      url: abs(path),
      changeFrequency: "monthly" as const,
      priority: path === UGANDA_ISO_HUB_PATH ? 0.9 : 0.8,
    })),
    {
      url: abs("/internal-audit-training"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Per-standard certification landing pages (ISO 27001, 27701, PCI DSS…).
    ...STANDARDS.map((s) => ({
      url: abs(`/certifications/${s.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: abs("/verify"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: abs("/privacy"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: abs("/terms"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: abs(INTERNAL_AUDITOR_ENROLL_PATH),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Include active course pages so they can be indexed and rank individually.
  // Checkout URLs (/enroll/...) stay out: they are noindex.
  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("courses")
      .select("title")
      .eq("is_active", true);
    const seen = new Set<string>();
    courseRoutes = [];
    for (const course of data || []) {
      const url = abs(coursePath(course));
      if (seen.has(url)) continue;
      seen.add(url);
      courseRoutes.push({
        url,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // If Supabase is unavailable at build time, still emit the static routes.
  }

  return [...staticRoutes, ...courseRoutes];
}
