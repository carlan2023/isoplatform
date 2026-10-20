// ---------------------------------------------------------------------------
// Where certificate rows live, and when clearly fake preview rows may be
// inserted. Production never seeds, and the in-memory store cannot turn on
// when Vercel is hosting the app.
// ---------------------------------------------------------------------------

type CertificateEnv = {
  NODE_ENV?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
  CERTIFICATE_STORE?: string;
  CERTIFICATE_DEMO_SEED?: string;
};

export function localMemoryCertificateStore(
  env: CertificateEnv = process.env,
): boolean {
  if (env.CERTIFICATE_STORE !== "memory") return false;
  if (env.NODE_ENV !== "development") return false;
  if (env.VERCEL === "1") return false;
  if (env.VERCEL_ENV) return false;
  return true;
}

/**
 * Preview deployments insert NAMQMS-DEMO-* rows so the verifier can be
 * reviewed before launch. Production never inserts them, even if
 * CERTIFICATE_DEMO_SEED is set.
 */
export function demoSeedEnabled(env: CertificateEnv = process.env): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.CERTIFICATE_DEMO_SEED === "false") return false;
  if (env.VERCEL_ENV === "preview") return true;
  return env.CERTIFICATE_DEMO_SEED === "true";
}
