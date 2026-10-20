// ---------------------------------------------------------------------------
// Where certificate rows live, and when clearly fake preview rows may be
// inserted. Only VERCEL_ENV=preview may insert them. Production never does.
// The in-memory store cannot turn on when Vercel is hosting the app.
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
 * Sample rows are inserted only by a Vercel preview deployment.
 * Production never inserts them. CERTIFICATE_DEMO_SEED=true cannot turn
 * seeding on, including when preview and production share a database and
 * the production app is the one answering. Set CERTIFICATE_DEMO_SEED=false
 * to stop a preview deployment from inserting the samples.
 */
export function demoSeedEnabled(env: CertificateEnv = process.env): boolean {
  if (env.VERCEL_ENV !== "preview") return false;
  if (env.CERTIFICATE_DEMO_SEED === "false") return false;
  return true;
}
