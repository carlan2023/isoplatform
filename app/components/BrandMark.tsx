/**
 * Header and course-page brand mark.
 *
 * The seal keeps the existing navy ring, teal field, mint check and gold tip.
 * The word is the text "NAM" (not a raster that can be read as "AM"), forced
 * to a fixed width so all three letters stay inside the mark at every height,
 * including the mobile header.
 */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 136 48"
      width={136}
      height={48}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="22"
        cy="24"
        r="18"
        fill="none"
        stroke="#0f172a"
        strokeWidth="2.25"
      />
      <circle cx="22" cy="24" r="14" fill="#0d9488" />
      <path
        d="M13.2 24.8 18.6 30.2 30.6 16.2"
        fill="none"
        stroke="#ccfbf1"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.4 19.8 30.6 16.2"
        fill="none"
        stroke="#d4a017"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <text
        x="46"
        y="33.5"
        fill="#0d9488"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="26"
        textLength="82"
        lengthAdjust="spacingAndGlyphs"
      >
        NAM
      </text>
    </svg>
  );
}
