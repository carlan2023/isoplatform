// ---------------------------------------------------------------------------
// Release or confirm Mobile Money holds by asking BroRacks, and drop holds
// that are still pending after 15 minutes.
//
// Used by the learner status poll and the cron sweep. Cash/offline holds
// (OFFLINE-CASH) are never touched. A provider outage does not release a seat.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  decideHold,
  type ProviderPaymentState,
} from "@/lib/collection-status";
import {
  describeBroRacksFailure,
  fetchCollectionStatus,
} from "@/lib/broracks";
import { shouldConfirmPayment } from "@/lib/webhook";
import { OFFLINE_REF, sendPaymentReleasedEmail } from "@/lib/enrollment-emails";
import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  getStaffInbox,
  sendResendEmail,
} from "@/lib/email";

const CHECK_INTERVAL_MS = 15_000;
const lastProviderCheck = new Map<string, number>();

export interface HeldEnrollment {
  id: string;
  user_id: string;
  status: string;
  amount_paid: number | null;
  stripe_session_id: string | null;
  course_id: string | null;
  held_at?: string | null;
  courses?: { title?: string | null } | { title?: string | null }[] | null;
}

export interface ReconcileResult {
  status: string;
  action: "confirm" | "release" | "wait";
}

function courseTitleOf(row: HeldEnrollment): string {
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  return course?.title || "your course";
}

function heldAtMs(row: HeldEnrollment): number | null {
  if (!row.held_at) return null;
  const ms = Date.parse(row.held_at);
  return Number.isNaN(ms) ? null : ms;
}

async function loadHeld(
  admin: SupabaseClient,
  opts: { enrollmentId?: string; limit?: number; skipOffline?: boolean },
): Promise<{ rows: HeldEnrollment[]; error: { message?: string } | null }> {
  const columnsWithHold =
    "id, user_id, status, amount_paid, stripe_session_id, course_id, held_at, courses (title)";
  const columnsWithout =
    "id, user_id, status, amount_paid, stripe_session_id, course_id, courses (title)";

  const run = (columns: string) => {
    let query = admin
      .from("enrollments")
      .select(columns)
      .eq("status", "awaiting_confirmation");
    if (opts.enrollmentId) query = query.eq("id", opts.enrollmentId);
    if (opts.skipOffline) {
      query = query.or(
        `stripe_session_id.is.null,stripe_session_id.neq."${OFFLINE_REF}"`,
      );
    }
    if (opts.limit) query = query.limit(opts.limit);
    return query;
  };

  const first = await run(columnsWithHold);
  if (
    first.error &&
    /held_at/i.test(String((first.error as { message?: string }).message ?? ""))
  ) {
    const second = await run(columnsWithout);
    return {
      rows: (second.data ?? []) as unknown as HeldEnrollment[],
      error: second.error,
    };
  }
  return {
    rows: (first.data ?? []) as unknown as HeldEnrollment[],
    error: first.error,
  };
}

async function releaseRow(
  admin: SupabaseClient,
  row: HeldEnrollment,
  reason: string,
): Promise<boolean> {
  const { data: released, error } = await admin
    .from("enrollments")
    .update({ status: "cancelled", amount_paid: 0 })
    .eq("id", row.id)
    .eq("status", "awaiting_confirmation")
    .select("id");
  if (error) {
    console.error(`[payments] could not release enrollment ${row.id}:`, error);
    return false;
  }
  if (!released || released.length === 0) return false;

  if (row.course_id) {
    const { error: seatErr } = await admin.rpc("recompute_course_seats", {
      p_course_id: row.course_id,
    });
    if (seatErr) {
      console.error("[payments] recompute seats failed:", seatErr);
    }
  }

  console.warn(
    `[payments] released enrollment ${row.id} ref=${row.stripe_session_id ?? "none"} reason=${reason}`,
  );

  const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
  await sendPaymentReleasedEmail({
    learnerEmail: userData?.user?.email,
    courseTitle: courseTitleOf(row),
  });
  return true;
}

async function confirmRow(
  admin: SupabaseClient,
  row: HeldEnrollment,
  providerAmount: number | null,
  currency: string | null,
): Promise<boolean> {
  const reference = row.stripe_session_id ?? "";
  if (
    !shouldConfirmPayment(
      providerAmount,
      Number(row.amount_paid),
      currency,
    )
  ) {
    console.error(
      `[payments] amount mismatch for ${reference}: provider ${providerAmount ?? "unknown"} ${currency ?? ""}, expected ${row.amount_paid} UGX`,
    );
    return false;
  }

  const { data: confirmed, error } = await admin
    .from("enrollments")
    .update({ status: "confirmed" })
    .eq("id", row.id)
    .eq("status", "awaiting_confirmation")
    .eq("stripe_session_id", reference)
    .select("id");
  if (error) {
    console.error(`[payments] could not confirm enrollment ${row.id}:`, error);
    return false;
  }
  if (!confirmed || confirmed.length === 0) return false;

  const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
  const email = userData?.user?.email?.trim();
  const title = courseTitleOf(row);
  const amountLabel = `UGX ${Number(row.amount_paid ?? 0).toLocaleString()}`;
  if (email) {
    const mail = await sendResendEmail({
      from: getResendFrom(),
      to: email,
      subject: `Payment confirmed — ${title}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
          <h1 style="margin: 0; font-size: 22px;">You're enrolled</h1>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            Your payment of <strong>${escapeHtml(amountLabel)}</strong> was received.
            You are now enrolled in <strong>${escapeHtml(title)}</strong>.
            Reference: <strong>${escapeHtml(reference)}</strong>
          </p>
        </div>
      `,
    });
    if (!mail.ok) console.error("[payments] confirmation email failed:", mail.error);
  }
  const staff = await sendResendEmail({
    from: getResendNotificationsFrom(),
    to: getStaffInbox(),
    subject: `Payment confirmed — ${title} · ref ${reference}`,
    html: `<p style="font-family: system-ui, sans-serif;">Enrollment confirmed for ${escapeHtml(title)}. Reference ${escapeHtml(reference)}. Amount ${escapeHtml(amountLabel)}.</p>`,
  });
  if (!staff.ok) console.error("[payments] staff confirmation email failed:", staff.error);
  return true;
}

/** Ask BroRacks about one held enrollment and confirm or release it. */
export async function reconcileEnrollment(
  admin: SupabaseClient,
  row: HeldEnrollment,
  opts?: { force?: boolean; nowMs?: number },
): Promise<ReconcileResult> {
  if (row.status !== "awaiting_confirmation") {
    return { status: row.status, action: "wait" };
  }
  const reference = row.stripe_session_id ?? "";
  const offline = reference === OFFLINE_REF;
  const needsProvider = !offline && !!reference && !reference.startsWith("CLAIM-");
  let state: ProviderPaymentState = "pending";
  let amount: number | null = null;
  let currency: string | null = null;
  let checked = !needsProvider;
  if (needsProvider) {
    const now = Date.now();
    const previous = lastProviderCheck.get(reference);
    const force = opts?.force === true;
    if (force || !previous || now - previous >= CHECK_INTERVAL_MS) {
      lastProviderCheck.set(reference, now);
      checked = true;
      try {
        const status = await fetchCollectionStatus(reference);
        state = status.state;
        amount = status.amount;
        currency = status.currency;
      } catch (error) {
        const described = describeBroRacksFailure(error);
        console.error(
          `[payments] status check failed ref=${reference} status=${described.status ?? "none"} code=${described.code ?? "none"} message=${described.message}`,
        );
        state = "unknown";
      }
    }
  }
  // A throttled poll must not age-release a hold we did not just re-check.
  if (!checked) return { status: row.status, action: "wait" };

  const action = decideHold({
    state: offline ? "pending" : state,
    heldAtMs: heldAtMs(row),
    nowMs: opts?.nowMs ?? Date.now(),
    offline,
  });

  if (action === "release") {
    const reason = state === "failed" ? "provider-failed" : "hold-timeout";
    const released = await releaseRow(admin, row, reason);
    return { status: released ? "cancelled" : row.status, action: released ? "release" : "wait" };
  }
  if (action === "confirm") {
    const confirmed = await confirmRow(admin, row, amount, currency);
    return { status: confirmed ? "confirmed" : row.status, action: confirmed ? "confirm" : "wait" };
  }
  return { status: row.status, action: "wait" };
}

export async function reconcileEnrollmentById(
  admin: SupabaseClient,
  enrollmentId: string,
  opts?: { force?: boolean },
): Promise<ReconcileResult | null> {
  const { rows, error } = await loadHeld(admin, { enrollmentId });
  if (error) {
    console.error("[payments] could not load enrollment:", error);
    return null;
  }
  const row = rows[0];
  if (!row) return null;
  return reconcileEnrollment(admin, row, opts);
}

/** Sweep held Mobile Money payments. Caps the batch so a run stays inside BroRacks' rate limit. */
export async function reconcileOpenHolds(
  admin: SupabaseClient,
  opts?: { limit?: number; nowMs?: number },
): Promise<{ checked: number; released: number; confirmed: number }> {
  const { rows, error } = await loadHeld(admin, {
    limit: opts?.limit ?? 10,
    skipOffline: true,
  });
  if (error) {
    console.error("[payments] could not list held enrollments:", error);
    return { checked: 0, released: 0, confirmed: 0 };
  }
  let released = 0;
  let confirmed = 0;
  for (const row of rows) {
    const result = await reconcileEnrollment(admin, row, {
      force: true,
      nowMs: opts?.nowMs,
    });
    if (result.action === "release") released += 1;
    if (result.action === "confirm") confirmed += 1;
  }
  return { checked: rows.length, released, confirmed };
}
