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
  name: "How AM Quality Management Systems gets your business ISO certified",
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
  `https://i.ytimg.com/vi/${PRIMARY_VIDEO.youtubeId}/maxresdefault.jpg`;

// ---------------------------------------------------------------------------
// Marketing photos in /public/media. `width`/`height` are the real pixel sizes
// (from optimisation) so next/image can reserve layout space and avoid CLS, and
// `alt` doubles as keyword-aligned image-SEO text. One record per file.
// ---------------------------------------------------------------------------
export const IMG = {
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
    alt: "Consultant leading an ISO 45001 implementation and internal-audit training workshop",
  },
} as const;

/** Image used for Open Graph / social share previews (the proof-of-outcome shot). */
export const OG_IMAGE = IMG.certifiedClients;
