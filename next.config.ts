import type { NextConfig } from "next";
import { APEX_HOST, CANONICAL_ORIGIN } from "./lib/site";

const nextConfig: NextConfig = {
  // Build gate: never ship a build with type errors. This is the Next.js
  // default, but we set it explicitly so the gate can't be silently disabled —
  // `next build` fails fast on a broken module layer, the same way
  // `npm run typecheck` and CI do. (Next 16 no longer runs ESLint during
  // `next build`; linting is a dedicated `npm run lint` step in CI.)
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    // Permanent (308) apex → www for every path, including static assets.
    // Next.js uses 308 rather than 301 so POST bodies (enrollment, webhooks)
    // are preserved. `/:path*` matches the site root as well as nested paths,
    // and the query string is forwarded.
    //
    // Vercel's domain redirect (Project → Settings → Domains) is applied
    // before this rule and currently answers 307. Set that domain redirect
    // to 308 as well, or attach the apex host to the deployment so this
    // rule is what visitors hit. See the pull request notes.
    const has = [{ type: "host" as const, value: APEX_HOST }];
    return [
      {
        source: "/:path*",
        has,
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
