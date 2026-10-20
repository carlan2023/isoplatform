import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Linkedin,
  Youtube,
} from "lucide-react";
import { SITE_NAME, LEGAL_NAME, CONTACT, SOCIALS } from "@/lib/site";
import { UGANDA_ISO_PAGES } from "@/lib/uganda-iso";

const sans = { fontFamily: "var(--font-geist-sans), sans-serif" } as const;

const QUICK_LINKS = [
  { label: "For Businesses", href: "/iso-certification-consulting" },
  { label: "Apply for Certification", href: "/apply" },
  { label: "Lead Auditor Training", href: "/#training" },
  { label: "Internal Audit Training", href: "/internal-audit-training" },
  { label: "Upcoming Courses", href: "/#courses" },
  { label: "ISO 27001", href: "/certifications/iso-27001" },
  { label: "Internal Auditor Courses", href: "/internal-auditor-courses" },
  { label: "Student Portal", href: "/login" },
];

const UGANDA_LINKS = UGANDA_ISO_PAGES.map((page) => ({
  label: page.footerLabel,
  href: page.path,
}));

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Verify a certificate", href: "/verify" },
];

// Only render a social icon when its URL is configured in lib/site.ts.
const SOCIAL_LINKS = [
  { label: "LinkedIn", href: SOCIALS.linkedin, Icon: Linkedin },
  { label: "YouTube", href: SOCIALS.youtube, Icon: Youtube },
].filter((s) => s.href);

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-5 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-4">
          {/* Brand + contact */}
          <div className="min-w-0 lg:col-span-2">
            {/*
              The original logo is a transparent PNG with navy type. On this
              dark footer it sits on a light chip so the artwork stays as-is
              and remains readable. Do not recolor or redraw the file.
            */}
            <Link
              href="/"
              aria-label={`${SITE_NAME} — home`}
              className="mb-5 block w-full max-w-[17rem] rounded-xl bg-white p-2.5 shadow-sm sm:max-w-[22rem] sm:p-3"
            >
              <Image
                src="/nam-qms-logo.png"
                alt={SITE_NAME}
                width={1280}
                height={586}
                unoptimized
                sizes="(min-width: 640px) 22rem, 17rem"
                className="h-auto w-full"
                style={{ width: "100%", height: "auto" }}
              />
            </Link>
            <p className="text-sm leading-relaxed max-w-sm mb-6" style={sans}>
              ISO certification consulting and internationally recognised Lead
              Auditor training for organisations across Uganda and East Africa.
            </p>
            <ul className="space-y-3 text-sm" style={sans}>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-start gap-3 hover:text-white transition-colors"
                >
                  <Mail size={16} className="text-teal-500 shrink-0 mt-0.5" />
                  <span className="min-w-0 break-words">{CONTACT.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex items-start gap-3 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-teal-500 shrink-0 mt-0.5" />
                  <span className="min-w-0">{CONTACT.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-white transition-colors"
                >
                  <MessageCircle size={16} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-teal-500 shrink-0 mt-0.5" />
                <span>{CONTACT.location}</span>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm mb-4" style={sans}>
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm" style={sans}>
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-0.5 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3
              className="text-white font-semibold text-sm mt-8 mb-4"
              style={sans}
            >
              ISO in Uganda
            </h3>
            <ul className="space-y-2.5 text-sm" style={sans}>
              {UGANDA_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-0.5 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + socials */}
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm mb-4" style={sans}>
              Company
            </h3>
            <ul className="space-y-2.5 text-sm" style={sans}>
              <li>
                <Link
                  href="/iso-certification-consulting#enquiry"
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-0.5 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {SOCIAL_LINKS.length > 0 && (
              <div className="flex items-center gap-3 mt-6">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-md border border-slate-700 flex items-center justify-center hover:border-teal-500 hover:text-white transition-colors"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-xs text-center leading-relaxed sm:text-left" style={sans}>
            © {new Date().getFullYear()} {LEGAL_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
