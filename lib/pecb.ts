// PECB partner page. NAM QMS delivers the training. PECB runs exams and
// certification. Do not attach PECB accreditations, logos, or prices here.

import { SITE_NAME, SITE_URL, abs } from "./site";

export const PECB_TRAINING_PATH = "/pecb-training-uganda";

export const PECB_META_TITLE =
  "PECB Training in Uganda, Africa & Middle East | NAM QMS";

export const PECB_META_DESCRIPTION =
  "NAM QMS is a PECB Authorized Training Reseller delivering classroom and live-online PECB training courses (1 to 5 days) in Uganda, Africa and the Middle East. Request a quote.";

export const PECB_HEADING =
  "PECB Training in Uganda, Africa and the Middle East";

export const PECB_INTRO =
  "NAM QMS is a PECB partner and a PECB Authorized Training Reseller. We deliver PECB training courses for ISO standards and other frameworks, in the classroom in Kampala and live online, to learners in Uganda, across Africa and in the Middle East.";

export const PECB_TRADEMARK_NOTICE =
  "PECB is a registered trademark of the PECB Group and is used under license. NAM QMS is an independent training provider; this is not a PECB website.";

export const PECB_QUOTE_LEAD =
  "Tell us the course you're interested in, the number of learners and your preferred format.";

export const PECB_INCLUDED = [
  "PECB training courses of 1 to 5 days, delivered in the classroom or live online.",
  "Courses covering ISO standards and other management system frameworks.",
  "PECB course materials, as provided by PECB.",
  "Guidance on PECB exam and certification steps. Exams and certification are run by PECB, not by NAM QMS.",
] as const;

export const PECB_STEPS = [
  {
    n: "01",
    title: "Request a quote",
    detail:
      "Tell us the course, the number of learners and your preferred dates and format (classroom or live online).",
  },
  {
    n: "02",
    title: "Receive your quote",
    detail: "We confirm the schedule, format and price. Pricing is by quote.",
  },
  {
    n: "03",
    title: "Enrol",
    detail: "Each learner is registered for the course.",
  },
  {
    n: "04",
    title: "Attend the training",
    detail:
      "Delivered by a PECB-approved trainer, in Kampala or live online.",
  },
  {
    n: "05",
    title: "PECB exam and certification",
    detail: "Handled by PECB under its own rules.",
  },
] as const;

export const PECB_AUDIENCE = [
  {
    title: "Individuals",
    desc: "Individuals building a career in quality, information security, risk, compliance or audit, who enrol in a course.",
  },
  {
    title: "Teams",
    desc: "Teams that want several staff trained together.",
  },
  {
    title: "Institutions",
    desc: "Institutions that also need help putting a management system in place can ask NAM QMS for implementation support, priced by quote.",
  },
] as const;

export const PECB_FAQS = [
  {
    q: "Where can I get PECB training in Uganda?",
    a: "NAM QMS is a PECB partner and a PECB Authorized Training Reseller that delivers PECB training courses in Uganda, in the classroom in Kampala and live online.",
  },
  {
    q: "Can I take a PECB Lead Auditor course in Kampala?",
    a: "Yes, where PECB offers a Lead Auditor course for the standard you need. NAM QMS delivers it in Kampala or live online. Request a quote to confirm the next dates.",
  },
  {
    q: "Do you offer PECB training outside Uganda?",
    a: "Yes. NAM QMS delivers PECB training to learners across Africa and the Middle East, live online or in the classroom by arrangement.",
  },
  {
    q: "How long are PECB training courses?",
    a: "PECB courses run from 1 to 5 days, depending on the course.",
  },
  {
    q: "How much does PECB training cost with NAM QMS?",
    a: "Pricing is by quote and depends on the course, format and number of learners. Request a quote for exact pricing.",
  },
  {
    q: "Who runs the PECB exam and issues the certificate?",
    a: "PECB. NAM QMS delivers the training. Exams and certification are PECB's and follow PECB's rules.",
  },
  {
    q: "Is NAM QMS a certification or accreditation body?",
    a: "No. NAM QMS is a training provider, a PECB partner and a PECB Authorized Training Reseller. It does not certify or accredit organisations or people.",
  },
  {
    q: "Can you train our whole team?",
    a: "Yes. We can run a PECB course for a group of your staff, in the classroom or live online. Contact us for a quote.",
  },
] as const;

/** Visible sentences, for tests that lock the partnership wording. */
export function pecbPublicText(): string {
  return [
    PECB_META_TITLE,
    PECB_META_DESCRIPTION,
    PECB_HEADING,
    PECB_INTRO,
    PECB_QUOTE_LEAD,
    PECB_TRADEMARK_NOTICE,
    ...PECB_INCLUDED,
    ...PECB_STEPS.flatMap((step) => [step.title, step.detail]),
    ...PECB_AUDIENCE.flatMap((item) => [item.title, item.desc]),
    ...PECB_FAQS.flatMap((item) => [item.q, item.a]),
  ].join("\n");
}

export function pecbPageJsonLd() {
  const pageUrl = abs(PECB_TRAINING_PATH);
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "PECB training",
    serviceType: "PECB training courses",
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: [
      { "@type": "Country", name: "Uganda" },
      { "@type": "Place", name: "Africa" },
      { "@type": "Place", name: "Middle East" },
    ],
    description: PECB_INTRO,
    url: pageUrl,
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PECB_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "PECB Training",
        item: pageUrl,
      },
    ],
  };

  return { service, faq, breadcrumb };
}
