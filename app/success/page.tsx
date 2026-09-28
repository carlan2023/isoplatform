// ---------------------------------------------------------------------------
// /success — post-payment landing page.
//
// Never claims success on its own: with ?enrollment=<id> it reads the real
// enrollment status for the signed-in learner (RLS: own rows only) and shows
// confirmed / processing / not completed accordingly. Without a verifiable
// enrollment it shows a neutral "check your dashboard" message.
// ---------------------------------------------------------------------------

import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Mail,
  XCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";
import { formatUGX } from "@/lib/pricing";
import { OFFLINE_REF } from "@/lib/enrollment-emails";
import AutoRefresh from "./AutoRefresh";

export const metadata: Metadata = {
  title: "Enrollment status",
  robots: { index: false, follow: false },
};

type View = {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  body: string;
  points: { icon: LucideIcon; text: string }[];
  refresh?: boolean;
};

const WHATSAPP = "https://wa.me/256707068533";

async function loadEnrollment(id: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { signedIn: false as const };

    const { data, error } = await supabase
      .from("enrollments")
      .select("id, status, amount_paid, stripe_session_id, courses (title)")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[success] enrollment lookup failed:", error);
      return { signedIn: true as const, enrollment: null };
    }
    return { signedIn: true as const, enrollment: data };
  } catch (e) {
    console.error("[success] load failed:", e);
    return { signedIn: true as const, enrollment: null };
  }
}

function viewFor(
  enrollment: {
    status: string;
    amount_paid: number | null;
    stripe_session_id: string | null;
    courses: unknown;
  } | null,
): View {
  if (!enrollment) {
    return {
      icon: Clock,
      iconClass: "text-slate-400",
      title: "Check your enrollment status",
      body: "We couldn't find the details of this payment here. Your dashboard always shows the latest status of your enrollments.",
      points: [
        { icon: Mail, text: "We email you as soon as a payment is confirmed" },
      ],
    };
  }

  const courseRow = (
    Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses
  ) as { title?: string } | null;
  const course = courseRow?.title ?? "your course";
  const amount = Number(enrollment.amount_paid) || 0;

  switch (enrollment.status) {
    case "confirmed":
      return {
        icon: CheckCircle,
        iconClass: "text-teal-600",
        title: "You're enrolled!",
        body: `Your payment${amount ? ` of ${formatUGX(amount)}` : ""} was received and your seat in ${course} is confirmed.`,
        points: [
          { icon: Mail, text: "A confirmation email is on its way" },
          { icon: Clock, text: "Joining instructions follow before the class starts" },
        ],
      };
    case "awaiting_confirmation":
      if (enrollment.stripe_session_id === OFFLINE_REF) {
        return {
          icon: Wallet,
          iconClass: "text-teal-600",
          title: "Seat reserved — payment pending",
          body: `We're holding your seat in ${course}. Pay${amount ? ` ${formatUGX(amount)}` : ""} by cash or bank transfer and we'll confirm it.`,
          points: [
            { icon: Mail, text: "Payment instructions were sent to your email" },
            { icon: Clock, text: "Your seat is confirmed once we receive payment" },
          ],
        };
      }
      return {
        icon: Clock,
        iconClass: "text-amber-500",
        title: "Payment processing",
        body: `We're waiting for Mobile Money to confirm your payment for ${course}. Approve the prompt on your phone if you haven't yet — this page updates automatically.`,
        points: [
          { icon: Mail, text: "You'll get an email as soon as it's confirmed" },
        ],
        refresh: true,
      };
    case "cancelled":
      return {
        icon: XCircle,
        iconClass: "text-red-500",
        title: "Payment not completed",
        body: `Your payment for ${course} was declined, cancelled or timed out, so your seat was released. No money was taken for this attempt.`,
        points: [
          { icon: Clock, text: "You can enroll again at any time" },
        ],
      };
    default:
      return {
        icon: Clock,
        iconClass: "text-slate-400",
        title: "Payment not started",
        body: `We haven't received a payment for ${course} yet. Continue your enrollment to reserve your seat.`,
        points: [],
      };
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollment?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.enrollment)
    ? params.enrollment[0]
    : params.enrollment;

  let view: View;
  let signedIn = true;
  if (isUuid(raw)) {
    const result = await loadEnrollment(raw);
    signedIn = result.signedIn;
    view = viewFor(result.signedIn ? result.enrollment : null);
  } else {
    view = viewFor(null);
  }

  const Icon = view.icon;
  const sans = { fontFamily: "system-ui, sans-serif" };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {view.refresh && <AutoRefresh intervalMs={5000} maxMs={10 * 60 * 1000} />}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 max-w-md w-full text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <Icon size={56} className={view.iconClass} aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          {view.title}
        </h1>
        <p className="text-slate-500 mb-8" style={sans} role="status">
          {view.body}
        </p>
        {view.points.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-8 space-y-3 text-left">
            {view.points.map((p) => {
              const PointIcon = p.icon;
              return (
                <div
                  key={p.text}
                  className="flex items-center gap-3 text-sm text-slate-600"
                  style={sans}
                >
                  <PointIcon
                    size={15}
                    className="text-teal-600 shrink-0"
                    aria-hidden="true"
                  />
                  {p.text}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <Link
            href={signedIn ? "/dashboard" : "/login?redirect=%2Fdashboard"}
            className="inline-block text-white font-bold px-6 py-3 rounded-lg transition-colors"
            style={{ backgroundColor: "#0d9488", ...sans }}
          >
            {signedIn ? "Go to my dashboard" : "Sign in to see your status"}
          </Link>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold underline"
            style={{ color: "#0d9488", ...sans }}
          >
            Questions? Message us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
