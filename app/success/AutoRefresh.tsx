"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the (server) page periodically while a payment is processing, so
 * the status updates without the learner having to reload. Stops after
 * `maxMs` to avoid polling forever from a forgotten tab.
 */
export default function AutoRefresh({
  intervalMs,
  maxMs,
}: {
  intervalMs: number;
  maxMs: number;
}) {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      if (Date.now() - started > maxMs) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, maxMs]);
  return null;
}
