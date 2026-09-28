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
  // One canonical host. Google had indexed both www. and the bare domain,
  // splitting ranking signals; send every www request to the bare domain.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.amqualitysystems.com" }],
        destination: "https://amqualitysystems.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
