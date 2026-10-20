// ---------------------------------------------------------------------------
// Server-side admin authorization for privileged API routes:
//   1. Identify the caller from their session cookie (anon client).
//   2. Confirm their profile role is "admin".
// Only then may the route use the service-role client.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { localMemoryCertificateStore } from "@/lib/certificate-runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Confirm the caller is a signed-in admin. Returns the admin's user id or a
// NextResponse to return early.
export async function requireAdmin(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { userId: user.id };
}

// Local `next dev` with CERTIFICATE_STORE=memory can open the certificate
// admin screen without a Supabase login. Preview and production never take
// this path: Vercel sets VERCEL=1, and production NODE_ENV blocks it too.
export async function requireAdminOrLocalDemo(): Promise<
  { userId: string } | { response: NextResponse }
> {
  if (localMemoryCertificateStore()) return { userId: "local-demo" };
  return requireAdmin();
}
