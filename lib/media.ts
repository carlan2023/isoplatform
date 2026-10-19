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

/** Poster frame for the consulting-page explainer. Hosted locally so the filename and alt are ours. */
export const PRIMARY_VIDEO_THUMBNAIL = {
  src: "/media/nam-qms-iso-certification-explainer-video-thumbnail.jpg",
  width: 480,
  height: 360,
  alt: "Black video thumbnail with a white play button for the NAM QMS ISO certification explainer",
} as const;

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
    src: "/media/team-holding-framed-certificate-uganda.webp",
    width: 624,
    height: 468,
    alt: "Professionals in business dress standing outside an office building and holding one framed certificate together",
  },
  leadAuditorTraining: {
    src: "/media/iso-lead-auditor-training-uganda.webp",
    width: 1280,
    height: 960,
    alt: "ISO Lead Auditor training session in Uganda with professionals at laptops",
  },
  foodSafetyAudit: {
    src: "/media/iso-22000-food-safety-warehouse-inspection.webp",
    width: 1600,
    height: 1200,
    alt: "Workers in white coats and hairnets inspecting packaged goods on warehouse shelves",
  },
  qmsImplementation: {
    src: "/media/iso-9001-document-review-meeting-uganda.webp",
    width: 1280,
    height: 1706,
    alt: "Two colleagues seated at a conference table reviewing a printed document, one pointing to a section on the page",
  },
  implementationTraining: {
    src: "/media/iso-implementation-whiteboard-workshop.webp",
    width: 1280,
    height: 960,
    alt: "A trainer pointing at a whiteboard of diagrams while professionals seated at a conference table take notes",
  },
  /**
   * Corporate internal-audit training hero (Pexels 5668778). Stock meeting
   * photo — do not swap in the IQS whiteboard training shot or real client photos.
   */
  internalAuditTraining: {
    src: "/media/iso-internal-audit-training.webp",
    width: 1600,
    height: 2400,
    alt: "Professionals collaborating around a conference table during a corporate training meeting",
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
  alt: "NAM QMS logo — ISO certification consulting and Lead Auditor training in Uganda and East Africa",
} as const;

export const ogImageMetadata = {
  url: OG_IMAGE.src,
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  alt: OG_IMAGE.alt,
};
