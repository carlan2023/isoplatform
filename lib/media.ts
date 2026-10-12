// ---------------------------------------------------------------------------
// Media identity — single source of truth for marketing video + shared images.
//
// Consumed by: the on-page video embed, VideoObject JSON-LD (for video rich
// results), Open Graph / Twitter card images, and the video sitemap entry.
// Keeping it here means one edit updates the embed, the structured data, and
// the social preview together.
// ---------------------------------------------------------------------------

/** Primary marketing / explainer video, hosted on YouTube. */
export const PRIMARY_VIDEO = {
  // https://youtu.be/G8GABbVuvug
  youtubeId: "G8GABbVuvug",
  // Fill these in — they feed VideoObject structured data (all required by
  // Google for a video rich result). Keep them keyword-aligned with the page.
  name: "How NAM Quality Management Systems gets your business ISO certified",
  description:
    "A short walkthrough of how we take organisations across Uganda and East Africa from gap analysis to a valid ISO 9001, 14001, 45001 or 22000 certificate.",
  // ISO 8601 date the video was published on YouTube, e.g. "2026-07-09".
  uploadDate: "2026-07-09",
  // Optional: "PT2M30s" style ISO 8601 duration once known.
  duration: undefined as string | undefined,
} as const;

export const PRIMARY_VIDEO_URL = `https://www.youtube.com/watch?v=${PRIMARY_VIDEO.youtubeId}`;
export const PRIMARY_VIDEO_EMBED_URL = `https://www.youtube-nocookie.com/embed/${PRIMARY_VIDEO.youtubeId}`;

/**
 * Video thumbnail. Prefer a custom high-res image at /public/media (better for
 * OG cards and click-through); falls back to YouTube's auto-generated frame.
 */
export const PRIMARY_VIDEO_THUMBNAIL =
  `https://i.ytimg.com/vi/${PRIMARY_VIDEO.youtubeId}/hqdefault.jpg`;

// ---------------------------------------------------------------------------
// Marketing photos in /public/media. `width`/`height` are the real pixel sizes
// (from optimisation) so next/image can reserve layout space and avoid CLS, and
// `alt` doubles as keyword-aligned image-SEO text. One record per file.
// ---------------------------------------------------------------------------
export const IMG = {
  /** Homepage hero: vector illustration (certificate, audit checklist, 4-step roadmap). */
  heroRoadmap: {
    src: "/media/iso-certification-roadmap-uganda.svg",
    width: 640,
    height: 468,
    alt: "ISO certification in Uganda: certificate of registration, audit checklist and the four steps from gap analysis to certification",
  },
  certifiedClients: {
    src: "/media/iso-certified-clients-uganda.webp",
    width: 624,
    height: 468,
    alt: "Ugandan business team holding their framed ISO certificates",
  },
  leadAuditorTraining: {
    src: "/media/iso-lead-auditor-training-uganda.webp",
    width: 1280,
    height: 960,
    alt: "ISO Lead Auditor training session in Uganda with professionals at laptops",
  },
  foodSafetyAudit: {
    src: "/media/iso-22000-food-safety-audit.webp",
    width: 1600,
    height: 1200,
    alt: "ISO 22000 food safety audit in a warehouse of stored produce in East Africa",
  },
  qmsImplementation: {
    src: "/media/iso-9001-implementation-uganda.webp",
    width: 1280,
    height: 1706,
    alt: "ISO 9001 quality management system implementation meeting reviewing a document register",
  },
  implementationTraining: {
    src: "/media/iso-implementation-training-auditing.webp",
    width: 1280,
    height: 960,
    alt: "Consultant leading an ISO implementation and internal-audit training workshop",
  },
} as const;

/**
 * Open Graph / Twitter card. A dedicated 1200×630 NAM QMS graphic at
 * /og-image.png — not a redirect, and not a photo that carries another brand.
 */
export const OG_IMAGE = {
  src: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "NAM Quality Management Systems — ISO certification consulting and Lead Auditor training in Uganda and East Africa",
} as const;

export const ogImageMetadata = {
  url: OG_IMAGE.src,
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  alt: OG_IMAGE.alt,
};
