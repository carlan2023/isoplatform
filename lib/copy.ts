// ---------------------------------------------------------------------------
// Public copy corrections for text that is stored outside the repo (course
// rows in Supabase). The site renders those strings in page copy, metadata,
// and JSON-LD, so the correction has to happen on the way out.
// ---------------------------------------------------------------------------

const ISO_22000_BLURB =
  /^food (?:safty|safety) management systems limited$/i;

/** "Food Safty …" → "Food Safety …", preserving the original capitalisation. */
export function fixFoodSafetyTypo(value: string): string {
  // The ISO 22000 blurb is this phrase plus a stray "Limited". Drop that word
  // so the public description is "Food Safety Management Systems".
  if (ISO_22000_BLURB.test(value.trim())) {
    return "Food Safety Management Systems";
  }
  return value.replace(/safty/gi, (match) => {
    if (match === match.toUpperCase()) return "SAFETY";
    if (match[0] === match[0].toUpperCase()) return "Safety";
    return "safety";
  });
}

/**
 * Correct known typos on course fields that are shown to visitors.
 * Titles are included so a typo there cannot leak into a page heading; the
 * live ISO 22000 row only has the typo in `description`, so course slugs
 * (which are derived from the title) do not change.
 */
export function presentCourseCopy<
  T extends {
    title?: string | null;
    description?: string | null;
    standard?: string | null;
  },
>(course: T): T {
  return {
    ...course,
    ...(typeof course.title === "string"
      ? { title: fixFoodSafetyTypo(course.title) }
      : {}),
    ...(typeof course.description === "string"
      ? { description: fixFoodSafetyTypo(course.description) }
      : {}),
    ...(typeof course.standard === "string"
      ? { standard: fixFoodSafetyTypo(course.standard) }
      : {}),
  };
}
