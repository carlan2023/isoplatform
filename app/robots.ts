import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep authenticated / transactional areas out of the index.
      disallow: ["/admin", "/dashboard", "/login", "/success", "/api/"],
    },
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
