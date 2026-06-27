import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build gate: never ship a build with type or lint errors. These are the
  // Next.js defaults, but we set them explicitly so the gate can't be silently
  // disabled — `next build` fails fast on a broken module layer, the same way
  // `npm run typecheck` and CI do.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
