import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { CalendarDays, Clock, Users, MapPin } from "lucide-react";
import EnrollForm from "@/app/components/EnrollForm";
import {
  INDIVIDUAL_PRICE,
  TEAM_PRICE,
  TEAM_MIN_SIZE,
  DEPOSIT_RATE,
  computePricing,
  formatUGX,
} from "@/lib/pricing";

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch course
  const { data: course } = await getSupabaseAdmin()
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) redirect("/");

  const seatsLeft = course.seats_total - (course.seats_taken || 0);
  const startDate = new Date(course.start_date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <a href="/" className="flex items-center">
            <img
              src="/amqms-v4-transparent.png"
              alt="AM Quality Management Systems"
              className="h-10 w-auto"
            />
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
        {/* Course Info */}
        <div>
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
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {course.title}
          </h1>
          <p
            className="text-slate-500 leading-relaxed mb-8"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {course.description}
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                icon: <CalendarDays size={16} />,
                label: "Start Date",
                value: startDate,
              },
              {
                icon: <Clock size={16} />,
                label: "Duration",
                value: `${course.duration_days} days`,
              },
              {
                icon: <MapPin size={16} />,
                label: "Format",
                value:
                  course.format === "virtual"
                    ? "Virtual / Online"
                    : "In Person",
              },
              {
                icon: <Users size={16} />,
                label: "Seats Remaining",
                value: `${seatsLeft} of ${course.seats_total}`,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    className="text-xs text-slate-400 uppercase tracking-wide"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="text-sm font-semibold text-slate-900"
                    style={{ fontFamily: "Georgia', serif" }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span
                  className="text-sm text-slate-600"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  Individual
                </span>
                <span className="font-bold text-slate-900">
                  {formatUGX(INDIVIDUAL_PRICE)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className="text-sm text-slate-600"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  Team ({TEAM_MIN_SIZE}+ people)
                </span>
                <span className="font-bold text-slate-900">
                  {formatUGX(TEAM_PRICE)}{" "}
                  <span className="text-xs text-slate-400">per person</span>
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span
                    className="text-sm text-slate-600"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    Minimum deposit ({Math.round(DEPOSIT_RATE * 100)}%)
                  </span>
                  <span className="font-bold" style={{ color: "#0d9488" }}>
                    {formatUGX(computePricing(1).minDeposit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Form */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-8 sticky top-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Complete Enrollment
            </h2>
            <p
              className="text-sm text-slate-500 mb-6"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Pay via Mobile Money. You will receive a prompt on your phone to
              approve.
            </p>
            <EnrollForm courseId={course.id} courseTitle={course.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
