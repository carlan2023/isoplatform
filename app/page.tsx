import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  ShieldCheck,
  Award,
  Globe,
} from "lucide-react";
import {
  INDIVIDUAL_PRICE,
  TEAM_PRICE,
  TEAM_MIN_SIZE,
  formatUGX,
} from "@/lib/pricing";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { STANDARDS } from "@/lib/standards";
import { IMG } from "@/lib/media";
import Footer from "@/app/components/Footer";

export const revalidate = 60;

async function getCourses() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("is_active", true)
      .order("start_date");
    return data || [];
  } catch (err) {
    // A public marketing homepage should never fail the whole build/deploy
    // because a data fetch hiccupped or env vars were missing. Render with no
    // courses ("No upcoming courses…") and let ISR retry on the next revalidate.
    console.error("Failed to load courses for homepage:", err);
    return [];
  }
}

export default async function HomePage() {
  const courses = await getCourses();

  // Flagship business offer — indexed on the homepage so the higher-value
  // "get your company ISO certified" intent ranks from the root URL.
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "ISO Certification Consulting",
    serviceType: "ISO certification consulting",
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    areaServed: [
      { "@type": "Country", name: "Uganda" },
      { "@type": "Place", name: "East Africa" },
    ],
    description:
      "We help businesses across Uganda and East Africa get ISO 9001, 14001, 45001 and 22000 certified — gap analysis, documentation, internal audits and certification-audit preparation, end to end.",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "ISO certification services",
      itemListElement: [
        "ISO gap analysis",
        "Management system documentation",
        "Internal auditor training",
        "Certification audit preparation",
        "Post-certification maintenance",
        "ISO 27001 information security certification",
        "ISO 27701 privacy certification",
        "PCI DSS compliance",
        "ISO Lead Auditor training",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name },
      })),
    },
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />

      {/* NAV */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="./amqms-v4-transparent.png"
            alt="AM Quality Management Systems"
            className="h-12 w-auto"
          />
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link
              href="/iso-certification-consulting"
              className="hover:text-teal-600 transition-colors font-semibold text-slate-800"
            >
              For Businesses
            </Link>
            <a
              href="#courses"
              className="hover:text-teal-600 transition-colors"
            >
              Training
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
              <ShieldCheck size={12} />
              ISO Certification for Businesses
            </div>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
              Helping businesses get{" "}
              <span style={{ color: "#0d9488" }}>ISO certified</span> in Uganda &
              East Africa
            </h1>
            <p
              className="text-slate-500 text-lg leading-relaxed mb-8"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              We take your organisation all the way to ISO 9001, 14001, 45001
              and 22000 certification — gap analysis, documentation, internal
              audits and certification-audit preparation, handled end to end. We
              also run internationally recognised Lead Auditor training for
              professionals.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/iso-certification-consulting"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Get your business certified <ArrowRight size={16} />
              </Link>
              <a
                href="#training"
                className="text-slate-600 text-sm underline underline-offset-4"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Looking for Lead Auditor training?
              </a>
            </div>
          </div>

          {/* Hero visual + standards panel — clickable cards into consulting */}
          <div className="space-y-4">
            <Image
              src={IMG.certifiedClients.src}
              width={IMG.certifiedClients.width}
              height={IMG.certifiedClients.height}
              alt={IMG.certifiedClients.alt}
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="w-full h-auto rounded-xl border border-slate-200 shadow-sm object-cover"
            />
            <div className="grid grid-cols-2 gap-4">
            {[
              { code: "ISO 9001", label: "Quality Management" },
              { code: "ISO 14001", label: "Environmental" },
              { code: "ISO 45001", label: "Health & Safety" },
              { code: "ISO 22000", label: "Food Safety" },
            ].map((s) => (
              <Link
                key={s.code}
                href="/iso-certification-consulting"
                className="group block border border-slate-200 rounded-lg p-6 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-teal-200"
              >
                <div className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">
                  {s.code}
                </div>
                <div
                  className="text-sm text-slate-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.label}
                </div>
              </Link>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES — consulting teaser (full detail lives on the
          dedicated /iso-certification-consulting page) */}
      <section
        id="consulting"
        className="border-b border-slate-100"
        style={{ backgroundColor: "#f0fdfa" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-6 bg-white"
              style={{
                borderColor: "#99f6e4",
                color: "#0f766e",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <ShieldCheck size={12} /> What we do for your business
            </div>
            <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
              End-to-end{" "}
              <span style={{ color: "#0d9488" }}>ISO certification</span>{" "}
              consulting
            </h2>
            <p
              className="text-slate-600 leading-relaxed mb-6"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              From your first gap analysis to a valid certificate, we manage the
              whole journey — ISO 9001, 14001, 45001 and 22000. Documentation,
              internal audits and certification-audit preparation, so your team
              can keep running the business.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/iso-certification-consulting"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Explore ISO Certification Consulting <ArrowRight size={16} />
              </Link>
              <a
                href="https://wa.me/256707068533"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 text-sm underline underline-offset-4"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Talk to us on WhatsApp
              </a>
            </div>
            <p
              className="text-sm text-slate-500 mt-5"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Handling sensitive or payment data? We also do{" "}
              <Link
                href="/certifications/iso-27001"
                className="text-teal-600 hover:underline font-medium"
              >
                ISO 27001
              </Link>
              ,{" "}
              <Link
                href="/certifications/iso-27701"
                className="text-teal-600 hover:underline font-medium"
              >
                ISO 27701
              </Link>{" "}
              and{" "}
              <Link
                href="/certifications/pci-dss"
                className="text-teal-600 hover:underline font-medium"
              >
                PCI DSS
              </Link>
              .
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Gap analysis",
              "Documentation support",
              "Internal auditor training",
              "Certification audit prep",
              "Post-certification maintenance",
              "Integrated management systems",
            ].map((service) => (
              <div
                key={service}
                className="flex items-center gap-3 bg-white border border-teal-100 rounded-lg px-4 py-3"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: "#0d9488" }}
                />
                <span
                  className="text-sm text-slate-700 font-medium"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {service}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS — information-security & data-protection landing pages */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-6"
              style={{
                backgroundColor: "#f0fdfa",
                borderColor: "#99f6e4",
                color: "#0f766e",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <ShieldCheck size={12} /> Information Security & Data Protection
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              ISO 27001, ISO 27701 &amp; PCI DSS
            </h2>
            <p
              className="text-slate-500 max-w-2xl"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Handling sensitive or payment data? We take organisations through
              information-security and data-protection certification, end to end.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STANDARDS.map((s) => (
              <Link
                key={s.slug}
                href={`/certifications/${s.slug}`}
                className="group relative border border-slate-200 rounded-lg p-6 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-teal-200"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#f0fdfa" }}
                >
                  <ShieldCheck size={20} style={{ color: "#0d9488" }} />
                </div>
                <div className="text-xl font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">
                  {s.code}
                </div>
                <div
                  className="text-sm font-medium text-slate-600 mb-3"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.name}
                </div>
                <p
                  className="text-sm text-slate-500 leading-relaxed mb-4"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.tagline}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-sm text-teal-600 font-medium"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  Learn more{" "}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRAINING — Lead Auditor training for individuals (demoted from hero so
          the business intent leads, but still fully indexable and linkable). */}
      <section id="training" className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
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
              <Award size={12} /> Internationally Recognised Training
            </div>
            <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
              Become a certified{" "}
              <span style={{ color: "#0d9488" }}>ISO Lead Auditor</span>
            </h2>
            <p
              className="text-slate-600 leading-relaxed mb-6"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Professional Lead Auditor training for ISO 9001, ISO 14001 and ISO
              45001 — equipping quality and compliance professionals across East
              Africa. Every enrollment includes study materials, mock audits and
              exam coaching.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#courses"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                View upcoming courses <ArrowRight size={16} />
              </a>
              <a
                href="#pricing"
                className="text-slate-600 text-sm underline underline-offset-4"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                See training pricing
              </a>
            </div>
          </div>

          {/* Training visual + stats panel */}
          <div className="space-y-4">
            <Image
              src={IMG.leadAuditorTraining.src}
              width={IMG.leadAuditorTraining.width}
              height={IMG.leadAuditorTraining.height}
              alt={IMG.leadAuditorTraining.alt}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="w-full h-auto rounded-lg border border-slate-200 object-cover"
            />
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
        </div>
      </section>

      {/* WHY US */}
      <section id="why" className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Why work with AM Quality Management Systems?
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
          {courses.length === 0 && (
            <div
              className="border border-slate-200 rounded-lg p-12 text-center text-slate-500"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              No upcoming courses are scheduled right now. Please check back soon.
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group relative border border-slate-200 rounded-lg overflow-hidden bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-teal-200"
              >
                {/* Whole-card overlay link to the course description. Sits below
                    the Enroll button (which is z-10) so both are clickable. */}
                <Link
                  href={`/courses/${course.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`View ${course.title}`}
                />
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
                  <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-teal-700 transition-colors">
                    {course.title}
                  </h3>
                  <p
                    className="text-slate-500 text-sm mb-5 leading-relaxed line-clamp-3"
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
                        {formatUGX(INDIVIDUAL_PRICE)}
                      </div>
                      <div
                        className="text-xs text-teal-600"
                        style={{ fontFamily: "system-ui, sans-serif" }}
                      >
                        {formatUGX(TEAM_PRICE)} for teams of {TEAM_MIN_SIZE}+
                      </div>
                    </div>
                    <Link
                      href={`/enroll/${course.id}`}
                      className="relative z-10 inline-flex items-center gap-1 text-white text-sm px-4 py-2 rounded-md font-medium transition-colors hover:brightness-95"
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
                {formatUGX(INDIVIDUAL_PRICE)}
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
                For companies enrolling {TEAM_MIN_SIZE} or more people
              </p>
              <div className="text-4xl font-bold text-slate-900 mb-1">
                {formatUGX(TEAM_PRICE)}
              </div>
              <div
                className="text-sm text-slate-500 mb-6"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                per person · minimum {TEAM_MIN_SIZE}
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
      <Footer />
    </main>
  );
}
