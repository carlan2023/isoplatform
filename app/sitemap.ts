import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { abs } from "@/lib/site";
import { STANDARDS } from "@/lib/standards";

// Regenerate alongside the ISR pages so newly published courses appear.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: abs("/iso-certification-consulting"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Per-standard certification landing pages (ISO 27001, 27701, PCI DSS…).
    ...STANDARDS.map((s) => ({
      url: abs(`/certifications/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  // Include active course pages so they can be indexed and rank individually.
  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("courses")
      .select("id")
      .eq("is_active", true);
    courseRoutes = (data || []).map((c) => ({
      url: abs(`/enroll/${c.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // If Supabase is unavailable at build time, still emit the static routes.
  }

  return [...staticRoutes, ...courseRoutes];
}
