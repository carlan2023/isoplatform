"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  BookOpen,
  Clock,
  LogOut,
  CheckCircle2,
  Wallet,
  CalendarClock,
  User as UserIcon,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { formatUGX } from "@/lib/pricing";

type Profile = {
  role?: string | null;
  full_name?: string | null;
  phone?: string | null;
  company?: string | null;
};

type Enrollment = {
  id: string;
  status: string;
  amount_paid: number | null;
  enrolled_at?: string | null;
  course_id?: string | null;
  courses?: {
    id?: string | null;
    title: string | null;
    standard: string | null;
    start_date: string | null;
    duration_days?: number | null;
    format?: string | null;
  } | null;
};

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  confirmed: { cls: "bg-green-100 text-green-700", label: "Confirmed" },
  awaiting_confirmation: {
    cls: "bg-blue-100 text-blue-700",
    label: "Confirming payment",
  },
  cancelled: { cls: "bg-red-100 text-red-600", label: "Cancelled" },
  pending: { cls: "bg-amber-100 text-amber-700", label: "Awaiting payment" },
};

const sans = { fontFamily: "system-ui, sans-serif" as const };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "profile">("overview");
  // Captured once at load so the "days until" countdown is stable across
  // re-renders (calling Date.now() during render is impure).
  const [loadedAt, setLoadedAt] = useState(0);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profile);

      if (profile?.role === "admin") {
        router.push("/admin");
        return;
      }

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false });
      setEnrollments((enrollments ?? []) as Enrollment[]);
      setLoadedAt(Date.now());
      setLoading(false);
    };
    load();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // -------- analytics (derived from real enrollment data only) --------
  const stats = useMemo(() => {
    const active = enrollments.filter((e) => e.status !== "cancelled");
    const confirmed = active.filter((e) => e.status === "confirmed").length;
    const awaiting = active.filter(
      (e) => e.status === "awaiting_confirmation",
    ).length;
    const pending = active.filter((e) => e.status === "pending").length;
    // Only count money that's actually settled (confirmed).
    const totalPaid = enrollments
      .filter((e) => e.status === "confirmed")
      .reduce((sum, e) => sum + (e.amount_paid || 0), 0);

    const now = loadedAt || 0;
    const upcoming = active
      .filter(
        (e) =>
          (e.status === "confirmed" ||
            e.status === "awaiting_confirmation") &&
          e.courses?.start_date &&
          new Date(e.courses.start_date).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.courses!.start_date!).getTime() -
          new Date(b.courses!.start_date!).getTime(),
      );
    const next = upcoming[0] ?? null;
    const daysToNext = next?.courses?.start_date
      ? Math.ceil(
          (new Date(next.courses.start_date).getTime() - now) / 86_400_000,
        )
      : null;

    return {
      total: active.length,
      confirmed,
      awaiting,
      pending,
      totalPaid,
      next,
      daysToNext,
    };
  }, [enrollments, loadedAt]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "#0d9488" }}
        />
      </div>
    );

  const firstName = profile?.full_name?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: "#0d9488" }}
          >
            <ShieldCheck size={15} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">
            AM Quality Management Systems
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline" style={sans}>
            {profile?.full_name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 transition-colors"
            style={sans}
          >
            <LogOut size={14} /> Sign out.
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-slate-500 text-sm mb-6" style={sans}>
          Track your enrollments, payments, and upcoming training.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-8">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "profile", label: "Profile" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderBottom:
                  tab === t.id ? "2px solid #0d9488" : "2px solid transparent",
                color: tab === t.id ? "#0d9488" : "#94a3b8",
                ...sans,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  icon: <BookOpen size={18} className="text-teal-600" />,
                  value: stats.total,
                  label: "Enrollments",
                },
                {
                  icon: <CheckCircle2 size={18} className="text-green-600" />,
                  value: stats.confirmed,
                  label: "Confirmed",
                },
                {
                  icon: <Clock size={18} className="text-amber-600" />,
                  value: stats.pending + stats.awaiting,
                  label: "In progress",
                },
                {
                  icon: <Wallet size={18} className="text-teal-600" />,
                  value: formatUGX(stats.totalPaid),
                  label: "Total paid",
                  small: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white border border-slate-200 rounded-xl p-5"
                >
                  <div className="mb-3">{s.icon}</div>
                  <div
                    className={`font-bold text-slate-900 ${s.small ? "text-lg" : "text-2xl"}`}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5" style={sans}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Next course banner */}
            {stats.next && (
              <div
                className="rounded-xl p-5 mb-8 flex items-center gap-4"
                style={{ backgroundColor: "#f0fdfa", border: "1px solid #99f6e4" }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "white" }}
                >
                  <CalendarClock size={22} style={{ color: "#0d9488" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-teal-700 font-medium" style={sans}>
                    {stats.daysToNext === 0
                      ? "Starts today"
                      : `Your next course starts in ${stats.daysToNext} day${stats.daysToNext === 1 ? "" : "s"}`}
                  </div>
                  <div className="font-bold text-slate-900 truncate">
                    {stats.next.courses?.title}
                  </div>
                  <div className="text-xs text-slate-500" style={sans}>
                    {new Date(
                      stats.next.courses!.start_date!,
                    ).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Enrollments */}
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              My courses
            </h2>
            {enrollments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <BookOpen size={32} className="text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">
                  No enrollments yet
                </h3>
                <p className="text-slate-400 text-sm mb-6" style={sans}>
                  Browse our upcoming courses and reserve your seat.
                </p>
                <Link
                  href="/#courses"
                  className="inline-block text-white text-sm px-5 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: "#0d9488", ...sans }}
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((e) => {
                  const badge =
                    STATUS_BADGE[e.status] ?? STATUS_BADGE.pending;
                  const courseId = e.courses?.id || e.course_id;
                  return (
                    <div
                      key={e.id}
                      className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <span
                          className="text-xs font-medium px-2 py-1 rounded border inline-block mb-2"
                          style={{
                            backgroundColor: "#f0fdfa",
                            borderColor: "#99f6e4",
                            color: "#0f766e",
                            ...sans,
                          }}
                        >
                          {e.courses?.standard}
                        </span>
                        <h3 className="font-bold text-slate-900">
                          {e.courses?.title}
                        </h3>
                        <div
                          className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-400"
                          style={sans}
                        >
                          {e.courses?.start_date && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(
                                e.courses.start_date,
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {(e.amount_paid || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Wallet size={12} />
                              {formatUGX(e.amount_paid || 0)} paid
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${badge.cls}`}
                          style={sans}
                        >
                          {badge.label}
                        </span>
                        {e.status === "pending" && courseId ? (
                          <Link
                            href={`/enroll/${courseId}`}
                            className="inline-flex items-center gap-1 text-white text-sm px-4 py-2 rounded-lg font-medium"
                            style={{ backgroundColor: "#0d9488", ...sans }}
                          >
                            Complete payment <ArrowRight size={14} />
                          </Link>
                        ) : courseId ? (
                          <Link
                            href={`/courses/${courseId}`}
                            className="inline-flex items-center gap-1 text-teal-600 text-sm px-3 py-2 rounded-lg font-medium hover:bg-teal-50"
                            style={sans}
                          >
                            View <ArrowRight size={14} />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <ProfileTab user={user} profile={profile} onSaved={setProfile} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile editor
// ---------------------------------------------------------------------------
function ProfileTab({
  user,
  profile,
  onSaved,
}: {
  user: User | null;
  profile: Profile | null;
  onSaved: (p: Profile) => void;
}) {
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    company: profile?.company ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setStatus("idle");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatus("idle");
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("saved");
    onSaved({ ...profile, ...form });
  };

  const labelCls =
    "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide";
  const inputCls =
    "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500";

  return (
    <div className="max-w-lg">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: "#0d9488" }}
          >
            {(profile?.full_name || user?.email || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900">
              {profile?.full_name || "Your profile"}
            </div>
            <div className="text-xs text-slate-400" style={sans}>
              {user?.email}
            </div>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className={labelCls} style={sans}>
              Full Name
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className={inputCls}
              style={sans}
            />
          </div>
          <div>
            <label className={labelCls} style={sans}>
              Phone
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputCls}
              style={sans}
            />
          </div>
          <div>
            <label className={labelCls} style={sans}>
              Organisation / Company
            </label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              className={inputCls}
              style={sans}
            />
          </div>
          <div>
            <label className={labelCls} style={sans}>
              Email
            </label>
            <input
              value={user?.email ?? ""}
              disabled
              className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`}
              style={sans}
            />
            <p className="text-xs text-slate-400 mt-1" style={sans}>
              Contact us to change the email on your account.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: "#0d9488", ...sans }}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <UserIcon size={15} /> Save changes
                </>
              )}
            </button>
            {status === "saved" && (
              <span className="text-sm text-green-600 flex items-center gap-1" style={sans}>
                <CheckCircle2 size={15} /> Saved
              </span>
            )}
            {status === "error" && (
              <span className="text-sm text-red-500" style={sans}>
                Could not save. Please try again.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
