import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Linkedin,
  Youtube,
} from "lucide-react";
import { SITE_NAME, LEGAL_NAME, CONTACT, SOCIALS } from "@/lib/site";
import LaunchBadge from "@/app/components/LaunchBadge";

const sans = { fontFamily: "system-ui, sans-serif" } as const;

const QUICK_LINKS = [
  { label: "For Businesses", href: "/iso-certification-consulting" },
  { label: "Lead Auditor Training", href: "/#training" },
  { label: "Upcoming Courses", href: "/#courses" },
  { label: "ISO 27001", href: "/certifications/iso-27001" },
  { label: "Student Portal", href: "/login" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

// Only render a social icon when its URL is configured in lib/site.ts.
const SOCIAL_LINKS = [
  { label: "LinkedIn", href: SOCIALS.linkedin, Icon: Linkedin },
  { label: "YouTube", href: SOCIALS.youtube, Icon: Youtube },
].filter((s) => s.href);

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand + contact */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-6 h-6 rounded-sm flex items-center justify-center"
                style={{ backgroundColor: "#0d9488" }}
              >
                <ShieldCheck size={13} className="text-white" />
              </div>
              <span className="text-white font-bold">{SITE_NAME}</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm mb-6" style={sans}>
              ISO certification consulting and internationally recognised Lead
              Auditor training for organisations across Uganda and East Africa.
            </p>
            <ul className="space-y-3 text-sm" style={sans}>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="inline-flex items-center gap-3 hover:text-white transition-colors"
                >
                  <Mail size={16} className="text-teal-500 shrink-0" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="inline-flex items-center gap-3 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-teal-500 shrink-0" />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 hover:text-white transition-colors"
                >
                  <MessageCircle size={16} className="text-teal-500 shrink-0" />
                  Chat on WhatsApp
                </a>
              </li>
              <li className="inline-flex items-center gap-3">
                <MapPin size={16} className="text-teal-500 shrink-0" />
                {CONTACT.location}
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4" style={sans}>
              Explore
            </h3>
            <ul className="space-y-3 text-sm" style={sans}>
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + socials */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4" style={sans}>
              Company
            </h3>
            <ul className="space-y-3 text-sm" style={sans}>
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
                    className="hover:text-white transition-colors"
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
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs" style={sans}>
            © {new Date().getFullYear()} {LEGAL_NAME}. All rights reserved.
          </p>
          <LaunchBadge />
        </div>
      </div>
    </footer>
  );
}
