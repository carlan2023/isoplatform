// ---------------------------------------------------------------------------
// Certification standards — single source of truth for the information-security
// & data-protection consulting offer (ISO 27001, ISO 27701, PCI DSS).
//
// Each entry drives its own SEO landing page at /certifications/<slug>, the
// sitemap, JSON-LD, the homepage/consulting cross-links, and the enquiry form
// dropdown. Add a standard here and it becomes discoverable everywhere — do NOT
// hardcode standard copy in pages or components.
// ---------------------------------------------------------------------------

export type StandardService = { title: string; desc: string };
export type StandardStep = { n: string; title: string; desc: string };
export type StandardFaq = { q: string; a: string };

export type Standard = {
  /** URL segment under /certifications/ */
  slug: string;
  /** e.g. "ISO 27001" */
  code: string;
  /** e.g. "Information Security Management" */
  name: string;
  /** Cluster this standard belongs to. */
  category: string;
  /** Exact label used in the enquiry-form dropdown (must match an <option>). */
  enquiryLabel: string;
  /** Short one-liner for cards. */
  tagline: string;
  /** H1 for the landing page. */
  heading: string;
  /** Lead paragraph under the H1. */
  intro: string;
  /** <title> and meta description for the page. */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Who typically needs this standard. */
  whoFor: string;
  /** Business benefits of certification. */
  benefits: string[];
  /** What our engagement delivers. */
  services: StandardService[];
  /** The road to certification / attestation. */
  process: StandardStep[];
  /** Indicative starting price in UGX (scope-dependent). */
  priceFrom: number;
  /** Caption shown next to the price. */
  priceNote: string;
  faqs: StandardFaq[];
};

const SHARED_PROCESS: StandardStep[] = [
  {
    n: "01",
    title: "Gap analysis",
    desc: "We assess your current controls against the standard and deliver a prioritised, practical action plan.",
  },
  {
    n: "02",
    title: "Implementation",
    desc: "We build the required policies, controls and evidence alongside your team — tailored to how you actually operate.",
  },
  {
    n: "03",
    title: "Internal audit & testing",
    desc: "We run internal audits and control testing to catch weaknesses before the assessor does.",
  },
  {
    n: "04",
    title: "Certification / assessment",
    desc: "We prepare you for, and support you through, the formal certification or assessment.",
  },
  {
    n: "05",
    title: "Maintain & improve",
    desc: "We keep you compliant through surveillance audits, re-assessments and continual improvement.",
  },
];

export const STANDARDS: Standard[] = [
  {
    slug: "iso-27001",
    code: "ISO 27001",
    name: "Information Security Management",
    category: "Information Security & Data Protection",
    enquiryLabel: "ISO 27001 — Information Security",
    tagline: "The global standard for managing information security risk.",
    heading: "ISO 27001 certification for businesses in Uganda & East Africa",
    intro:
      "ISO/IEC 27001 is the international standard for an Information Security Management System (ISMS). We take your organisation from first risk assessment to a certified ISMS — policies, controls, internal audits and certification-audit preparation, handled end to end so you can win security-conscious clients and tenders with confidence.",
    metaTitle: "ISO 27001 Certification in Uganda & East Africa",
    metaDescription:
      "ISO 27001 (ISMS) certification consulting for businesses in Uganda and East Africa — risk assessment, Annex A controls, documentation, internal audits and certification-audit preparation, end to end.",
    keywords: [
      "ISO 27001 certification Uganda",
      "ISO 27001 East Africa",
      "ISMS certification",
      "information security management system",
      "ISO 27001 consulting",
      "ISO 27001 gap analysis",
    ],
    whoFor:
      "Software companies, fintechs, BPOs, telecoms, banks and any organisation that stores or processes sensitive customer data — especially those bidding for international or enterprise contracts that require an ISMS.",
    benefits: [
      "Win tenders and enterprise clients that mandate ISO 27001",
      "Reduce the risk and cost of data breaches",
      "Demonstrate due diligence to regulators and partners",
      "Build a repeatable, auditable security programme",
    ],
    services: [
      {
        title: "ISMS scoping & risk assessment",
        desc: "We define your ISMS scope and run a full information-security risk assessment and treatment plan.",
      },
      {
        title: "Annex A controls implementation",
        desc: "We implement the applicable Annex A controls and produce your Statement of Applicability.",
      },
      {
        title: "Documentation & policies",
        desc: "We develop the security policies, procedures and records the standard requires.",
      },
      {
        title: "Internal audit & management review",
        desc: "We train internal auditors, run the internal audit, and facilitate management review.",
      },
      {
        title: "Certification audit preparation",
        desc: "We run mock audits and support you through the certification body's Stage 1 and Stage 2 audits.",
      },
    ],
    process: SHARED_PROCESS,
    priceFrom: 12_000_000,
    priceNote: "indicative — final scope depends on your size and systems",
    faqs: [
      {
        q: "How long does ISO 27001 certification take?",
        a: "For most small to mid-sized organisations, ISO 27001 takes roughly 4 to 8 months from gap analysis to the certification audit, depending on the size of your operation and how mature your existing controls are.",
      },
      {
        q: "Is ISO 27001 the same as being 'compliant'?",
        a: "ISO 27001 certification is issued by an accredited certification body after a formal audit. Our job is to build your ISMS and prepare you thoroughly so you meet every requirement before that audit.",
      },
      {
        q: "Can ISO 27001 be combined with ISO 27701 or ISO 9001?",
        a: "Yes. ISO 27701 extends ISO 27001 for privacy, and we frequently run an integrated management system that also covers ISO 9001. Doing them together reduces duplicated effort and cost.",
      },
    ],
  },
  {
    slug: "iso-27701",
    code: "ISO 27701",
    name: "Privacy Information Management",
    category: "Information Security & Data Protection",
    enquiryLabel: "ISO 27701 — Privacy Information Management",
    tagline: "The privacy extension to ISO 27001 for data protection.",
    heading: "ISO 27701 certification — privacy information management in East Africa",
    intro:
      "ISO/IEC 27701 extends ISO 27001 into a Privacy Information Management System (PIMS). We help you build and certify a privacy programme that maps to data-protection law — including Uganda's Data Protection and Privacy Act and the GDPR — so you can prove to customers and regulators that personal data is handled responsibly.",
    metaTitle: "ISO 27701 Privacy Certification in Uganda & East Africa",
    metaDescription:
      "ISO 27701 (PIMS) privacy certification consulting in Uganda and East Africa — extend your ISO 27001 ISMS to cover data protection, map to the Data Protection & Privacy Act and GDPR, end to end.",
    keywords: [
      "ISO 27701 certification",
      "privacy information management system",
      "PIMS certification Uganda",
      "data protection certification East Africa",
      "GDPR compliance Uganda",
      "ISO 27701 consulting",
    ],
    whoFor:
      "Organisations that process personal data at scale — fintechs, health-tech, HR and payroll providers, marketing and data companies — and any business that already holds or is pursuing ISO 27001 and needs to demonstrate privacy compliance.",
    benefits: [
      "Demonstrate compliance with the Data Protection & Privacy Act and GDPR",
      "Extend an existing ISO 27001 ISMS with minimal duplication",
      "Reassure customers that personal data is protected",
      "Reduce regulatory and reputational risk",
    ],
    services: [
      {
        title: "Privacy gap analysis",
        desc: "We benchmark your data-handling against ISO 27701 and applicable privacy law and prioritise the gaps.",
      },
      {
        title: "Data mapping & records of processing",
        desc: "We map personal-data flows and build your records of processing activities.",
      },
      {
        title: "PIMS controls & policies",
        desc: "We implement the ISO 27701 controls for controllers and/or processors and the required privacy policies.",
      },
      {
        title: "Data subject rights & DPIA processes",
        desc: "We put in place processes for data-subject requests, consent, and data-protection impact assessments.",
      },
      {
        title: "Certification audit preparation",
        desc: "We run mock audits and support you through the certification body's audit alongside your ISO 27001.",
      },
    ],
    process: SHARED_PROCESS,
    priceFrom: 8_000_000,
    priceNote: "indicative — lower when added to an existing ISO 27001 ISMS",
    faqs: [
      {
        q: "Do we need ISO 27001 before ISO 27701?",
        a: "Yes — ISO 27701 is an extension of ISO 27001, so you need an ISMS (either already certified or implemented in parallel). We commonly run the two together.",
      },
      {
        q: "Does ISO 27701 make us GDPR compliant?",
        a: "ISO 27701 is designed to map closely to GDPR and other privacy laws and is strong evidence of a well-run privacy programme, but certification is not a legal ruling. We align your PIMS to the specific laws that apply to you.",
      },
      {
        q: "How long does ISO 27701 take?",
        a: "As an extension it is usually faster than a standalone standard — often 2 to 4 months when built on top of an existing or in-progress ISO 27001 ISMS.",
      },
    ],
  },
  {
    slug: "pci-dss",
    code: "PCI DSS",
    name: "Payment Card Data Security",
    category: "Information Security & Data Protection",
    enquiryLabel: "PCI DSS — Payment Card Security",
    tagline: "The security standard for handling payment card data.",
    heading: "PCI DSS compliance for businesses in Uganda & East Africa",
    intro:
      "The Payment Card Industry Data Security Standard (PCI DSS) applies to any organisation that stores, processes or transmits cardholder data. We take you from scoping and gap analysis to a completed Self-Assessment Questionnaire (SAQ) or a Report on Compliance — reducing your scope, hardening your systems, and preparing the evidence so you can process card payments with confidence.",
    metaTitle: "PCI DSS Compliance in Uganda & East Africa",
    metaDescription:
      "PCI DSS compliance consulting for businesses in Uganda and East Africa — scoping, gap analysis, remediation, SAQ and Report on Compliance preparation for organisations handling payment card data.",
    keywords: [
      "PCI DSS compliance Uganda",
      "PCI DSS East Africa",
      "PCI DSS consulting",
      "payment card security",
      "PCI DSS SAQ",
      "cardholder data security",
    ],
    whoFor:
      "Banks, fintechs, payment aggregators, merchants, e-commerce businesses, and any organisation that stores, processes or transmits cardholder data or influences the security of card transactions.",
    benefits: [
      "Meet the requirements of banks and payment schemes (Visa, Mastercard)",
      "Reduce the scope — and cost — of your card-data environment",
      "Lower the risk of card-data breaches and fines",
      "Unlock the ability to process card payments at scale",
    ],
    services: [
      {
        title: "Scoping & merchant/SP level assessment",
        desc: "We determine your PCI DSS scope, merchant or service-provider level, and the right validation route (SAQ vs RoC).",
      },
      {
        title: "Gap analysis against PCI DSS",
        desc: "We assess your cardholder-data environment against the current PCI DSS requirements and prioritise remediation.",
      },
      {
        title: "Scope reduction & segmentation",
        desc: "We help reduce and segment your card-data environment to cut both risk and ongoing compliance effort.",
      },
      {
        title: "Remediation & documentation",
        desc: "We implement the required technical and policy controls and assemble the evidence.",
      },
      {
        title: "SAQ / RoC preparation",
        desc: "We prepare your Self-Assessment Questionnaire or support your Report on Compliance and Attestation of Compliance.",
      },
    ],
    process: [
      {
        n: "01",
        title: "Scoping",
        desc: "We define your cardholder-data environment, validation level and the correct SAQ or RoC route.",
      },
      {
        n: "02",
        title: "Gap analysis",
        desc: "We assess your environment against PCI DSS and deliver a prioritised remediation plan.",
      },
      {
        n: "03",
        title: "Remediation",
        desc: "We implement and document the required controls and reduce your scope where possible.",
      },
      {
        n: "04",
        title: "Validation",
        desc: "We prepare your SAQ, or support a QSA through the Report on Compliance and Attestation of Compliance.",
      },
      {
        n: "05",
        title: "Maintain",
        desc: "We keep you compliant through ongoing scans, reviews and your annual re-validation.",
      },
    ],
    priceFrom: 10_000_000,
    priceNote: "indicative — depends on your merchant level and environment",
    faqs: [
      {
        q: "Which PCI DSS level applies to us?",
        a: "It depends on your transaction volume and role (merchant vs service provider). We determine your level during scoping and confirm whether you need a Self-Assessment Questionnaire or a full Report on Compliance.",
      },
      {
        q: "Is PCI DSS an ISO standard?",
        a: "No — PCI DSS is maintained by the PCI Security Standards Council, not ISO. It is a compliance requirement of the payment card brands and acquiring banks, and it pairs well with an ISO 27001 ISMS.",
      },
      {
        q: "Do you issue the certification?",
        a: "Formal validation is done via a Self-Assessment Questionnaire or by a Qualified Security Assessor (QSA). Our role is to reduce your scope, remediate the gaps and prepare all the evidence so validation is straightforward.",
      },
    ],
  },
];

/** All standards in a single cluster (used for section grouping/labels). */
export const SECURITY_CATEGORY = "Information Security & Data Protection";

export function getStandard(slug: string): Standard | undefined {
  return STANDARDS.find((s) => s.slug === slug);
}

export function allStandardSlugs(): string[] {
  return STANDARDS.map((s) => s.slug);
}
