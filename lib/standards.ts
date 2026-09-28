// ---------------------------------------------------------------------------
// Certification standards — single source of truth for the certification
// consulting offer, in two clusters:
//   - MANAGEMENT_CATEGORY: quality, environment, health & safety and food
//     safety (ISO 9001, ISO 14001, ISO 45001, ISO 22000)
//   - SECURITY_CATEGORY: information security & data protection
//     (ISO 27001, ISO 27701, PCI DSS)
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

/** Cluster labels (used for section grouping/labels). */
export const MANAGEMENT_CATEGORY =
  "Quality, Environment, Health & Safety and Food Safety";
export const SECURITY_CATEGORY = "Information Security & Data Protection";

export const STANDARDS: Standard[] = [
  {
    slug: "iso-9001",
    code: "ISO 9001",
    name: "Quality Management",
    category: MANAGEMENT_CATEGORY,
    enquiryLabel: "ISO 9001 — Quality Management",
    tagline: "The world's most widely used standard for quality management.",
    heading: "ISO 9001 certification in Uganda: quality management consulting",
    intro:
      "ISO 9001 is the international standard for a Quality Management System (QMS). We help Ugandan organisations build a practical QMS that fits how they already work: defined processes, clear responsibilities, customer focus and continual improvement. From gap analysis to internal audits and certification-audit preparation, we handle the groundwork so you are ready for the accredited certification body's audit and for tenders that ask for ISO 9001.",
    metaTitle: "ISO 9001 Certification in Uganda | Cost & Timeline",
    metaDescription:
      "ISO 9001 certification consulting in Uganda: gap analysis, QMS documentation, internal audits and certification-audit preparation for tenders and growth.",
    keywords: [
      "ISO 9001 certification in Uganda",
      "ISO 9001 Uganda",
      "ISO certification in Uganda",
      "quality management system Uganda",
      "ISO 9001 consultants Kampala",
      "ISO 9001 certification cost Uganda",
      "ISO 9001 East Africa",
    ],
    whoFor:
      "Any organisation that wants consistent, well-run operations: manufacturers, construction and engineering firms, suppliers and distributors, logistics companies, service providers, NGOs and public-sector suppliers, especially those bidding for tenders or contracts that ask for ISO 9001 certification.",
    benefits: [
      "Meet tender and supplier requirements that ask for ISO 9001",
      "Deliver more consistent products and services with fewer errors and rework",
      "Improve customer satisfaction and handle complaints systematically",
      "Give management clear objectives, data and accountability",
      "Build a base for adding ISO 14001, ISO 45001 or ISO 27001 later",
    ],
    services: [
      {
        title: "Gap analysis & QMS scoping",
        desc: "We assess your current processes against ISO 9001, agree the scope of your QMS and deliver a prioritised action plan.",
      },
      {
        title: "Process mapping & documentation",
        desc: "We map your key processes and develop the quality policy, objectives, procedures and records the standard requires, kept lean and usable.",
      },
      {
        title: "Risk, objectives & performance",
        desc: "We set up risk and opportunity management, measurable quality objectives and the monitoring your management team needs.",
      },
      {
        title: "Internal audit & management review",
        desc: "We train your internal auditors, run the internal audit and facilitate your first management review.",
      },
      {
        title: "Certification audit preparation",
        desc: "We run a mock audit and support you through the certification body's Stage 1 and Stage 2 audits.",
      },
    ],
    process: SHARED_PROCESS,
    faqs: [
      {
        q: "How long does ISO 9001 certification take, and how much does it cost?",
        a: "Most small to mid-sized organisations are ready for the certification audit in about 3 to 6 months, depending on how established their processes already are. Cost depends on your size, number of sites and the scope of the QMS, so we give you a fixed quote after a short scoping call.",
      },
      {
        q: "Is ISO 9001 certification the same as UNBS certification?",
        a: "No. The Uganda National Bureau of Standards (UNBS) certifies products against product standards, for example with the Q-Mark. ISO 9001 certifies your management system, and the certificate is issued by an accredited certification body after an independent audit. Many organisations hold both.",
      },
      {
        q: "Do you issue the ISO 9001 certificate?",
        a: "No. Certification is carried out by an independent, accredited certification body. Our role is to build your QMS, train your team and prepare you thoroughly so you pass the certification audit with confidence.",
      },
      {
        q: "Can ISO 9001 be combined with ISO 14001 and ISO 45001?",
        a: "Yes. The three standards share a common structure, so many organisations implement them together as an Integrated Management System (IMS). This reduces duplicated documentation and allows a combined certification audit.",
      },
    ],
  },
  {
    slug: "iso-14001",
    code: "ISO 14001",
    name: "Environmental Management",
    category: MANAGEMENT_CATEGORY,
    enquiryLabel: "ISO 14001 — Environmental Management",
    tagline: "The international standard for managing environmental impact.",
    heading: "ISO 14001 certification in Uganda: environmental management consulting",
    intro:
      "ISO 14001 is the international standard for an Environmental Management System (EMS). We help Ugandan organisations identify their environmental aspects, keep track of their legal obligations, control their impacts and prepare for certification by an accredited certification body. A well-run EMS also makes it easier to demonstrate compliance with national environmental requirements overseen by NEMA.",
    metaTitle: "ISO 14001 Certification in Uganda | Cost & Timeline",
    metaDescription:
      "ISO 14001 certification consulting in Uganda: environmental aspects, legal register, EMS documentation, internal audits and certification-audit preparation.",
    keywords: [
      "ISO 14001 certification in Uganda",
      "ISO 14001 Uganda",
      "environmental management system Uganda",
      "EMS certification Uganda",
      "ISO 14001 consultants Kampala",
      "ISO 14001 certification cost Uganda",
      "ISO 14001 East Africa",
    ],
    whoFor:
      "Manufacturers, processors, construction and engineering firms, energy, oil and gas service companies, mining, agribusiness, logistics and waste management operators, and any organisation whose clients, financiers or tenders expect evidence of responsible environmental management.",
    benefits: [
      "Meet tender, client and financier environmental requirements",
      "Stay on top of environmental legal obligations, including NEMA requirements",
      "Reduce waste, energy and resource costs",
      "Lower the risk of pollution incidents and their consequences",
      "Strengthen your reputation with communities and partners",
    ],
    services: [
      {
        title: "Gap analysis & EMS scoping",
        desc: "We assess your current environmental practices against ISO 14001 and define the scope of your EMS.",
      },
      {
        title: "Aspects & impacts assessment",
        desc: "We identify your environmental aspects and rank their impacts so effort goes where it matters most.",
      },
      {
        title: "Legal & compliance register",
        desc: "We build a register of the environmental laws, permits and obligations that apply to you and a process to evaluate compliance.",
      },
      {
        title: "Operational controls & emergency preparedness",
        desc: "We put in place controls for waste, emissions, effluent, chemicals and resource use, plus environmental emergency procedures.",
      },
      {
        title: "Internal audit & certification preparation",
        desc: "We train internal auditors, run the internal audit and management review, and support you through the certification body's audits.",
      },
    ],
    process: SHARED_PROCESS,
    faqs: [
      {
        q: "How long does ISO 14001 certification take, and how much does it cost?",
        a: "Most organisations are ready for the certification audit in about 4 to 6 months, depending on the complexity of their operations and existing controls. Cost depends on your size, number of sites and scope, so we give you a fixed quote after a short scoping call.",
      },
      {
        q: "Does ISO 14001 replace NEMA requirements?",
        a: "No. ISO 14001 is voluntary and does not replace legal obligations such as environmental and social impact assessments or permits under NEMA. It gives you a structured system to identify those obligations, meet them and show evidence that you do.",
      },
      {
        q: "Who issues the ISO 14001 certificate?",
        a: "An independent, accredited certification body issues the certificate after a Stage 1 and Stage 2 audit. We prepare your EMS and your team so you are ready for that audit.",
      },
      {
        q: "Can ISO 14001 be combined with ISO 9001 and ISO 45001?",
        a: "Yes. The standards share a common structure and are often implemented together as an Integrated Management System, with one set of core procedures and a combined certification audit.",
      },
    ],
  },
  {
    slug: "iso-45001",
    code: "ISO 45001",
    name: "Occupational Health & Safety",
    category: MANAGEMENT_CATEGORY,
    enquiryLabel: "ISO 45001 — Occupational Health & Safety",
    tagline: "The international standard for workplace health and safety.",
    heading: "ISO 45001 certification in Uganda: occupational health & safety consulting",
    intro:
      "ISO 45001 is the international standard for an Occupational Health and Safety (OH&S) Management System. We help Ugandan organisations identify hazards, assess and control risks, involve workers and prepare for certification by an accredited certification body. A working OH&S system also supports compliance with the Occupational Safety and Health Act, 2006.",
    metaTitle: "ISO 45001 Certification in Uganda | Cost & Timeline",
    metaDescription:
      "ISO 45001 certification consulting in Uganda: hazard identification, risk assessment, OH&S documentation, internal audits and certification-audit preparation.",
    keywords: [
      "ISO 45001 certification in Uganda",
      "ISO 45001 Uganda",
      "occupational health and safety management system Uganda",
      "OHS certification Uganda",
      "ISO 45001 consultants Kampala",
      "ISO 45001 certification cost Uganda",
      "ISO 45001 East Africa",
    ],
    whoFor:
      "Construction and engineering firms, manufacturers, oil and gas and energy contractors, mining, logistics and transport companies, security services, hospitals and any organisation with significant workplace hazards or clients and tenders that require a certified OH&S system.",
    benefits: [
      "Meet client and tender requirements for a certified OH&S system",
      "Reduce workplace injuries, ill health and lost time",
      "Support compliance with the Occupational Safety and Health Act, 2006",
      "Show workers, clients and insurers that safety is managed systematically",
      "Improve contractor and site safety management",
    ],
    services: [
      {
        title: "Gap analysis & OH&S scoping",
        desc: "We assess your current safety practices against ISO 45001 and define the scope of your OH&S management system.",
      },
      {
        title: "Hazard identification & risk assessment",
        desc: "We identify workplace hazards, assess risks and set practical controls using the hierarchy of controls.",
      },
      {
        title: "Legal register & worker participation",
        desc: "We build your OH&S legal register and set up consultation and participation arrangements with workers.",
      },
      {
        title: "Procedures, incidents & emergency preparedness",
        desc: "We develop safe systems of work, incident reporting and investigation, contractor controls and emergency procedures.",
      },
      {
        title: "Internal audit & certification preparation",
        desc: "We train internal auditors, run the internal audit and management review, and support you through the certification body's audits.",
      },
    ],
    process: SHARED_PROCESS,
    faqs: [
      {
        q: "How long does ISO 45001 certification take, and how much does it cost?",
        a: "Most organisations are ready for the certification audit in about 4 to 6 months, depending on the hazards involved and how mature existing safety practices are. Cost depends on your size, number of sites and scope, so we give you a fixed quote after a short scoping call.",
      },
      {
        q: "Is ISO 45001 required by law in Uganda?",
        a: "No. ISO 45001 is voluntary. The legal duties come from the Occupational Safety and Health Act, 2006 and related regulations. ISO 45001 gives you a structured way to meet those duties and prove it, which is why many clients and tenders ask for it.",
      },
      {
        q: "Who issues the ISO 45001 certificate?",
        a: "An independent, accredited certification body issues the certificate after a formal audit. We build your OH&S system and prepare your team so you are ready for that audit.",
      },
      {
        q: "We are certified to OHSAS 18001. What changes with ISO 45001?",
        a: "ISO 45001 replaced OHSAS 18001. It places more emphasis on leadership, worker participation and the context of the organisation, and shares the common structure of ISO 9001 and ISO 14001. We can run a gap analysis to plan the transition.",
      },
    ],
  },
  {
    slug: "iso-22000",
    code: "ISO 22000",
    name: "Food Safety Management",
    category: MANAGEMENT_CATEGORY,
    enquiryLabel: "ISO 22000 — Food Safety",
    tagline: "The international standard for food safety across the food chain.",
    heading: "ISO 22000 certification in Uganda: food safety management consulting",
    intro:
      "ISO 22000 is the international standard for a Food Safety Management System (FSMS). It combines HACCP principles, prerequisite programmes and a management system approach. We help Ugandan food processors, manufacturers, packers and exporters build an FSMS that controls food safety hazards and prepares them for certification by an accredited certification body and for the expectations of buyers and export markets.",
    metaTitle: "ISO 22000 Certification in Uganda | Cost & Timeline",
    metaDescription:
      "ISO 22000 certification consulting in Uganda: HACCP, prerequisite programmes, FSMS documentation, internal audits and audit preparation for food businesses.",
    keywords: [
      "ISO 22000 certification in Uganda",
      "ISO 22000 Uganda",
      "food safety management system Uganda",
      "HACCP certification Uganda",
      "ISO 22000 consultants Kampala",
      "ISO 22000 certification cost Uganda",
      "food safety certification East Africa",
    ],
    whoFor:
      "Food and beverage processors and manufacturers, dairy, grain, coffee, honey, fish and fresh produce processors and exporters, packaging suppliers, caterers, hotels, storage and distribution businesses: any organisation in the food chain that must control food safety hazards or meet buyer and export requirements.",
    benefits: [
      "Meet buyer, supermarket and export market food safety requirements",
      "Control food safety hazards systematically using HACCP principles",
      "Reduce the risk of contamination, recalls and rejected consignments",
      "Improve traceability and supplier control",
      "Complement UNBS product certification with a certified management system",
    ],
    services: [
      {
        title: "Gap analysis & FSMS scoping",
        desc: "We assess your facilities and practices against ISO 22000 and define the products, processes and sites in scope.",
      },
      {
        title: "Prerequisite programmes",
        desc: "We establish prerequisite programmes such as hygiene, cleaning, pest control, maintenance, water and supplier control.",
      },
      {
        title: "Hazard analysis & HACCP plan",
        desc: "We lead your food safety team through hazard analysis and build your HACCP plan, operational PRPs and monitoring.",
      },
      {
        title: "Traceability, recall & verification",
        desc: "We set up traceability, product withdrawal and recall, and verification activities, and test them before the audit.",
      },
      {
        title: "Internal audit & certification preparation",
        desc: "We train internal auditors, run the internal audit and management review, and support you through the certification body's audits.",
      },
    ],
    process: SHARED_PROCESS,
    faqs: [
      {
        q: "How long does ISO 22000 certification take, and how much does it cost?",
        a: "Most food businesses are ready for the certification audit in about 4 to 8 months, depending on the state of their facilities, prerequisite programmes and product range. Cost depends on your size, number of sites and scope, so we give you a fixed quote after a short scoping call.",
      },
      {
        q: "What is the difference between ISO 22000 and HACCP?",
        a: "HACCP is a method for identifying and controlling food safety hazards. ISO 22000 includes HACCP principles and adds prerequisite programmes and a full management system: leadership, objectives, internal audit, management review and continual improvement.",
      },
      {
        q: "Does ISO 22000 replace UNBS certification of our products?",
        a: "No. UNBS certifies products against product standards, while ISO 22000 certifies your food safety management system through an accredited certification body. The two work together, and many processors hold both.",
      },
      {
        q: "Is ISO 22000 the same as FSSC 22000?",
        a: "FSSC 22000 is a certification scheme built on ISO 22000 plus sector-specific prerequisite programmes and additional requirements. Some international buyers ask for FSSC 22000 specifically. An ISO 22000 system is a strong foundation for it, and we can advise on which one your buyers need.",
      },
    ],
  },
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

/** Standards grouped by cluster (used for section grouping/labels). */
export const MANAGEMENT_STANDARDS = STANDARDS.filter(
  (s) => s.category === MANAGEMENT_CATEGORY,
);
export const SECURITY_STANDARDS = STANDARDS.filter(
  (s) => s.category === SECURITY_CATEGORY,
);

export function getStandard(slug: string): Standard | undefined {
  return STANDARDS.find((s) => s.slug === slug);
}

export function allStandardSlugs(): string[] {
  return STANDARDS.map((s) => s.slug);
}
