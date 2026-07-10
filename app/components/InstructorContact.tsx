import { MessageCircle, MessageSquare, Phone } from "lucide-react";
import { CONTACT } from "@/lib/site";

/**
 * A compact "talk to the instructor" panel for course / enrolment pages.
 * Offers WhatsApp chat, SMS text and a direct call — each pre-filled with the
 * course context where the channel supports it. Pure links, no client JS.
 */
export default function InstructorContact({
  courseTitle,
}: {
  courseTitle?: string;
}) {
  const subject = courseTitle
    ? `Hi, I have a question about the ${courseTitle} training.`
    : "Hi, I have a question about your ISO training.";

  const whatsappHref = `${CONTACT.whatsapp}?text=${encodeURIComponent(subject)}`;
  const smsHref = `sms:${CONTACT.phone}?body=${encodeURIComponent(subject)}`;
  const callHref = `tel:${CONTACT.phone}`;

  const channels = [
    {
      href: whatsappHref,
      icon: <MessageCircle size={16} />,
      label: "Chat on WhatsApp",
      external: true,
    },
    {
      href: smsHref,
      icon: <MessageSquare size={16} />,
      label: "Text the instructor",
      external: false,
    },
    {
      href: callHref,
      icon: <Phone size={16} />,
      label: `Call ${CONTACT.phoneDisplay}`,
      external: false,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-bold text-slate-900 mb-1">
        Questions before you enroll?
      </h3>
      <p
        className="text-sm text-slate-500 mb-4"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        Talk to the instructor directly — we usually reply within a few hours.
      </p>
      <div className="space-y-2.5">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            {...(c.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="flex items-center gap-3 w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}
            >
              {c.icon}
            </span>
            {c.label}
          </a>
        ))}
      </div>
    </div>
  );
}
