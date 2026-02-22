import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  ShieldCheck,
  Award,
  Globe,
} from "lucide-react";

export const revalidate = 60;

async function getCourses() {
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("start_date");
  return data || [];
}

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      {/* NAV */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: "#0d9488" }}
            >
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                Alrena
              </span>
              <span className="text-slate-400 text-sm ml-1">Group</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a
              href="#courses"
              className="hover:text-teal-600 transition-colors"
            >
              Courses
            </a>
            <a href="#why" className="hover:text-teal-600 transition-colors">
              Why Us
            </a>
            <a
              href="#pricing"
              className="hover:text-teal-600 transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Student Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-6"
              style={{
                backgroundColor: "#f0fdfa",
                borderColor: "#99f6e4",
                color: "#0f766e",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <Award size={12} />
              Internationally Recognised Training
            </div>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
              Become a Certified
              <br />
              <span style={{ color: "#0d9488" }}>ISO Lead Auditor</span>
            </h1>
            <p
              className="text-slate-500 text-lg leading-relaxed mb-8"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Professional Lead Auditor training for ISO 9001, ISO 14001, and
              ISO 45001. Equipping quality and compliance professionals across
              East Africa and beyond.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#courses"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                View Courses <ArrowRight size={16} />
              </a>
              <a
                href="#pricing"
                className="text-slate-600 text-sm underline underline-offset-4"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                See pricing
              </a>
            </div>
          </div>

          {/* Stats panel */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "500+", label: "Auditors Trained" },
              { value: "10+", label: "Years Experience" },
              { value: "3", label: "ISO Standards" },
              { value: "98%", label: "Pass Rate" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border border-slate-200 rounded-lg p-6"
              >
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </div>
                <div
                  className="text-sm text-slate-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why" className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Why train with Alrena Group
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Award size={22} className="text-teal-600" />,
                title: "Accredited Instructors",
                desc: "All our lead tutors are practising auditors with active certifications from Exemplar Global and IRCA.",
              },
              {
                icon: <Globe size={22} className="text-teal-600" />,
                title: "East Africa Focused",
                desc: "Course content and case studies are drawn from real East African industries — manufacturing, construction, and public sector.",
              },
              {
                icon: <ShieldCheck size={22} className="text-teal-600" />,
                title: "Exam Support Included",
                desc: "Every enrollment includes pre-exam coaching, mock audits, and access to our resource library for 6 months.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-slate-200 rounded-lg p-6"
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p
                  className="text-sm text-slate-500 leading-relaxed"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Upcoming Courses
            </h2>
            <p
              className="text-slate-500"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              All courses run for 5 days and include study materials, meals, and
              a certificate of completion.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card top accent */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: "#0d9488" }}
                />
                <div className="p-6">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded border mb-4 inline-block"
                    style={{
                      backgroundColor: "#f0fdfa",
                      borderColor: "#99f6e4",
                      color: "#0f766e",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {course.standard}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">
                    {course.title}
                  </h3>
                  <p
                    className="text-slate-500 text-sm mb-5 leading-relaxed"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {course.description}
                  </p>
                  <div className="space-y-2 mb-6">
                    <div
                      className="flex items-center gap-2 text-sm text-slate-500"
                      style={{ fontFamily: "system-ui, sans-serif" }}
                    >
                      <Calendar size={14} className="text-teal-600 shrink-0" />
                      {new Date(course.start_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div
                      className="flex items-center gap-2 text-sm text-slate-500"
                      style={{ fontFamily: "system-ui, sans-serif" }}
                    >
                      <Clock size={14} className="text-teal-600 shrink-0" />
                      {course.duration_days} days · {course.format}
                    </div>
                    <div
                      className="flex items-center gap-2 text-sm text-slate-500"
                      style={{ fontFamily: "system-ui, sans-serif" }}
                    >
                      <Users size={14} className="text-teal-600 shrink-0" />
                      {course.seats_total - course.seats_taken} seats remaining
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-slate-900">
                        UGX {Number(course.price_usd).toLocaleString()}
                      </div>
                      <div
                        className="text-xs text-teal-600"
                        style={{ fontFamily: "system-ui, sans-serif" }}
                      >
                        UGX 700,000 for teams of 3+
                      </div>
                    </div>
                    <Link
                      href={`/enroll/${course.id}`}
                      className="inline-flex items-center gap-1 text-white text-sm px-4 py-2 rounded-md font-medium transition-colors"
                      style={{
                        backgroundColor: "#0d9488",
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      Enroll <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p
            className="text-slate-500 mb-12"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            No hidden fees. All materials, meals, and certification included.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Individual */}
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-left">
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                Individual
              </h3>
              <p
                className="text-sm text-slate-500 mb-6"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                For professionals enrolling independently
              </p>
              <div className="text-4xl font-bold text-slate-900 mb-1">
                UGX 1,000,000
              </div>
              <div
                className="text-sm text-slate-500 mb-6"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                per person
              </div>
              <ul
                className="space-y-2 text-sm text-slate-600"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {[
                  "Course materials included",
                  "Lunch and refreshments",
                  "Certificate of completion",
                  "6 months resource access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-teal-600 shrink-0" />{" "}
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Team */}
            <div
              className="border-2 rounded-lg p-8 text-left relative"
              style={{ borderColor: "#0d9488", backgroundColor: "#f0fdfa" }}
            >
              <div
                className="absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full text-white"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Best Value
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                Team / Organisation
              </h3>
              <p
                className="text-sm text-slate-500 mb-6"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                For companies enrolling 3 or more people
              </p>
              <div className="text-4xl font-bold text-slate-900 mb-1">
                UGX 700,000
              </div>
              <div
                className="text-sm text-slate-500 mb-6"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                per person · minimum 3
              </div>
              <ul
                className="space-y-2 text-sm text-slate-600"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {[
                  "Everything in Individual",
                  "Dedicated account manager",
                  "Group invoice issued",
                  "Priority seat reservation",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-teal-600 shrink-0" />{" "}
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: "#0d9488" }}
            >
              <ShieldCheck size={13} className="text-white" />
            </div>
            <span className="text-white font-bold">Alrena Group</span>
          </div>
          <p
            className="text-sm"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            © {new Date().getFullYear()} Alrena Group. All rights reserved.
          </p>
          <Link
            href="/login"
            className="text-sm hover:text-white transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Student Portal
          </Link>
        </div>
      </footer>
    </main>
  );
}
