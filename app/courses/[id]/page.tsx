import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SITE_NAME, abs } from "@/lib/site";
import {
  INDIVIDUAL_PRICE,
  TEAM_PRICE,
  TEAM_MIN_SIZE,
  DEPOSIT_RATE,
  computePricing,
  formatUGX,
} from "@/lib/pricing";

export const revalidate = 60;

type Course = {
  id: string;
  title: string;
  standard: string | null;
  description: string | null;
  start_date: string;
  duration_days: number;
  format: "in-person" | "virtual" | string;
  seats_total: number;
  seats_taken: number;
  is_active: boolean;
};

async function getCourse(id: string): Promise<Course | null> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Course) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: "Course not found" };
  const title = `${course.title} — ${course.standard ?? "ISO"} Lead Auditor Training`;
  const description =
    course.description ??
    `${course.title}: internationally recognised ISO Lead Auditor training in East Africa.`;
  const path = `/courses/${course.id}`;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: abs(path),
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  const seatsLeft = course.seats_total - (course.seats_taken || 0);
  const isVirtual = course.format === "virtual";
  const startDate = new Date(course.start_date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description ?? undefined,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: abs("/"),
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: isVirtual ? "online" : "onsite",
      startDate: course.start_date,
      courseWorkload: `P${course.duration_days}D`,
      location: isVirtual
        ? undefined
        : { "@type": "Place", name: "East Africa" },
      offers: {
        "@type": "Offer",
        price: INDIVIDUAL_PRICE,
        priceCurrency: "UGX",
        availability:
          seatsLeft > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        url: abs(`/courses/${course.id}`),
      },
    },
  };

  const facts = [
    { icon: <CalendarDays size={16} />, label: "Start Date", value: startDate },
    {
      icon: <Clock size={16} />,
      label: "Duration",
      value: `${course.duration_days} days`,
    },
    {
      icon: <MapPin size={16} />,
      label: "Format",
      value: isVirtual ? "Virtual / Online" : "In Person",
    },
    {
      icon: <Users size={16} />,
      label: "Seats Remaining",
      value: `${seatsLeft} of ${course.seats_total}`,
    },
  ];

  const includes = [
    "Comprehensive course materials",
    "Practical mock audits and exercises",
    "Pre-exam coaching and support",
    "Certificate of completion",
    "6 months resource library access",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/amqms-v4-transparent.png"
              alt="AM Quality Management Systems"
              className="h-10 w-auto"
            />
          </Link>
          <Link
            href="/#courses"
            className="text-sm text-slate-500 hover:text-teal-600 transition-colors flex items-center gap-1"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <ArrowLeft size={14} /> All courses
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
        {/* Main */}
        <div className="md:col-span-2">
          {course.standard && (
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-4"
              style={{
                backgroundColor: "#f0fdfa",
                borderColor: "#99f6e4",
                color: "#0f766e",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {course.standard}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {course.title}
          </h1>
          <p
            className="text-slate-600 leading-relaxed mb-8"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {course.description}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-4"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}
                >
                  {f.icon}
                </div>
                <div>
                  <div
                    className="text-xs text-slate-400 uppercase tracking-wide"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {f.label}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {f.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-4">
            What&apos;s included
          </h2>
          <ul className="space-y-2 mb-4">
            {includes.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
                <span
                  className="text-sm text-slate-600"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sticky enroll / pricing */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-24">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {formatUGX(INDIVIDUAL_PRICE)}
            </div>
            <div
              className="text-sm text-slate-500 mb-5"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              per person · {formatUGX(TEAM_PRICE)} for teams of {TEAM_MIN_SIZE}+
            </div>

            {seatsLeft > 0 ? (
              <Link
                href={`/enroll/${course.id}`}
                className="w-full flex items-center justify-center gap-2 text-white text-sm font-bold py-3.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Enroll now <ArrowRight size={16} />
              </Link>
            ) : (
              <div
                className="w-full text-center text-sm font-semibold py-3.5 rounded-lg bg-slate-100 text-slate-400"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Fully booked
              </div>
            )}

            <div className="border-t border-slate-100 mt-5 pt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500" style={{ fontFamily: "system-ui, sans-serif" }}>
                  Minimum deposit ({Math.round(DEPOSIT_RATE * 100)}%)
                </span>
                <span className="font-bold" style={{ color: "#0d9488" }}>
                  {formatUGX(computePricing(1).minDeposit)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1" style={{ fontFamily: "system-ui, sans-serif" }}>
                <ShieldCheck size={13} className="text-teal-600" /> Pay a deposit
                or in full via Mobile Money
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
