"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { hubSpotPagePath, hubSpotPageViewCommands } from "@/lib/hubspot";

declare global {
  interface Window {
    _hsq?: unknown[][];
  }
}

/**
 * Records a HubSpot page view on client-side navigations.
 * The tracking script already records the first full page load, so the
 * initial effect is skipped. Later route changes are queued on `_hsq` and
 * flushed when the script loads, including a navigation that happens first.
 */
export default function HubSpotPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const path = hubSpotPagePath(pathname, search);
    const queue = (window._hsq = window._hsq || []);
    for (const command of hubSpotPageViewCommands(path)) {
      queue.push(command);
    }
  }, [pathname, search]);

  return null;
}
