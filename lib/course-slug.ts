// ---------------------------------------------------------------------------
// Readable course URLs. Courses are stored by UUID, but public links use a slug
// derived from the title (/courses/iso-9001-lead-auditor-training) because a
// keyword URL ranks and gets clicked better than /courses/b59f3877-.... Old UUID
// links still resolve: the course page 308-redirects them to the slug URL.
// ---------------------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** "ISO 9001:2015 Lead Auditor (Virtual)" -> "iso-9001-2015-lead-auditor-virtual" */
export function courseSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Public path for a course. */
export function coursePath(course: { title: string }): string {
  return `/courses/${courseSlug(course.title)}`;
}
