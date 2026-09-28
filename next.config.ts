import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build gate: never ship a build with type errors. This is the Next.js
  // default, but we set it explicitly so the gate can't be silently disabled —
  // `next build` fails fast on a broken module layer, the same way
  // `npm run typecheck` and CI do. (Next 16 no longer runs ESLint during
  // `next build`; linting is a dedicated `npm run lint` step in CI.)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
