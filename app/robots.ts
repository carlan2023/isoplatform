import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep authenticated / transactional areas out of the index.
      disallow: [
        "/admin",
        "/dashboard",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/success",
        "/api",
      ],
      // /enroll is left crawlable. Those pages send noindex, which only works
      // if the crawler is allowed to fetch them.
    },
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
