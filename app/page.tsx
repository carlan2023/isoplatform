import { supabase } from "@/lib/supabase";
import ConsultForm from "@/app/components/ConsultForm";
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
            Why train with AM Quality Management Systems?
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
      {/* CONSULTING */}
      <section id="consulting" className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          {/* Header */}
          <div className="grid md:grid-cols-2 gap-16 items-start mb-16">
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
                <ShieldCheck size={12} /> ISO Certification Consulting
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                We help organisations achieve{" "}
                <span style={{ color: "#0d9488" }}>ISO certification</span>
              </h2>
              <p
                className="text-slate-500 leading-relaxed mb-8"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Beyond training, we work directly with your organisation to
                implement management systems, prepare for certification audits,
                and maintain compliance. From initial gap analysis to
                post-certification support — we are with you every step of the
                way.
              </p>
              {/* Services */}
              <div className="space-y-3">
                {[
                  {
                    title: "Gap Analysis",
                    desc: "We assess your current systems against ISO requirements and produce a detailed action plan.",
                  },
                  {
                    title: "Documentation Support",
                    desc: "We develop all required policies, procedures, and records tailored to your operations.",
                  },
                  {
                    title: "Internal Auditor Training",
                    desc: "We train your team to conduct effective internal audits and maintain compliance year-round.",
                  },
                  {
                    title: "Certification Audit Preparation",
                    desc: "We run mock audits and coach your team so you walk into the certification audit with confidence.",
                  },
                  {
                    title: "Post-Certification Maintenance",
                    desc: "We provide ongoing support to ensure you maintain certification through surveillance audits.",
                  },
                ].map((s) => (
                  <div
                    key={s.title}
                    className="flex items-start gap-3 p-4 border border-slate-100 rounded-lg hover:border-teal-200 transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: "#0d9488" }}
                    />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {s.title}
                      </div>
                      <div
                        className="text-slate-500 text-sm mt-0.5"
                        style={{ fontFamily: "system-ui, sans-serif" }}
                      >
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                Get a free consultation
              </h3>
              <p
                className="text-slate-500 text-sm mb-6"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Tell us about your organisation and we'll get back to you within
                24 hours.
              </p>
              <ConsultForm />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="bg-slate-50 px-3 text-xs text-slate-400"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    or reach us directly
                  </span>
                </div>
              </div>

              <a
                href="https://wa.me/256707068533"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 border-2 font-semibold py-3 rounded-lg transition-colors hover:bg-green-50 text-sm"
                style={{
                  borderColor: "#25d366",
                  color: "#25d366",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>
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
