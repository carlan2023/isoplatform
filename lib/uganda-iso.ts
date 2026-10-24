// ---------------------------------------------------------------------------
// SEO landing pages for organisations in Uganda.
//
// One hub (/iso-certification-uganda) and one page per standard. Copy rules:
//   - Audience is institutions and organisations, not individual candidates.
//   - Lead with in-house / team training, the free gap analysis, and readiness.
//   - NAM QMS trains and consults. It does not issue ISO certificates and is
//     not a certification body.
//   - Never mention IQS. The public brand is "NAM QMS".
//   - Do not invent prices, accreditations, client names or statistics.
//     Fees stay on the existing course pages.
// ---------------------------------------------------------------------------

import { courseSlug } from "./course-slug";
import { IMG } from "./media";
import { CONTACT, SITE_LEGAL_NAME, SITE_NAME, SITE_URL, abs } from "./site";
import { UGANDA_ISO_HUB_PATH } from "./uganda-paths";

export const GAP_ANALYSIS_URL =
  "https://149517164.hs-sites-eu1.com/free-iso-gap-analysis";

export { UGANDA_ISO_HUB_PATH };

/** Scheduled Lead Auditor courses already published on the site. */
export const LEAD_AUDITOR_COURSE_PAGES = {
  iso9001: {
    title: "ISO 9001:2015 Lead Auditor",
    path: `/courses/${courseSlug("ISO 9001:2015 Lead Auditor")}`,
  },
  iso14001: {
    title: "ISO 14001:2015 Lead Auditor",
    path: `/courses/${courseSlug("ISO 14001:2015 Lead Auditor")}`,
  },
  iso27001: {
    title: "ISO 27001:2022 Lead Auditor",
    path: `/courses/${courseSlug("ISO 27001:2022 Lead Auditor")}`,
  },
  iso45001: {
    title: "ISO 45001:2018 Lead Auditor",
    path: `/courses/${courseSlug("ISO 45001:2018 Lead Auditor")}`,
  },
} as const;

export type UgandaIsoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type UgandaIsoFaq = { q: string; a: string };

export type UgandaIsoImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type UgandaIsoPage = {
  kind: "hub" | "standard";
  path: string;
  /** Short code shown on cards, e.g. "ISO 9001". Hub uses "ISO". */
  code: string;
  /** One line under the code on cards and in the footer. */
  name: string;
  footerLabel: string;
  /** Lowercase Google query that must appear in a heading and in the body. */
  query: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  lede: string;
  sections: UgandaIsoSection[];
  faqs: UgandaIsoFaq[];
  closing: string;
  image: UgandaIsoImage;
  /** Sentence used when an existing course page links here. */
  courseLinkLabel: string;
  serviceName: string;
  serviceType: string;
  gapAnalysisHref: string;
};

const NOT_A_BODY =
  "NAM QMS does not issue ISO certificates and is not a certification body. An independent accredited certification body plans the audit and issues the certificate if it decides the system meets the standard.";

function courseLink(title: string, path: string): string {
  return `[[${path}|${title} course page]]`;
}

const pages: UgandaIsoPage[] = [
  {
    kind: "hub",
    path: UGANDA_ISO_HUB_PATH,
    code: "ISO",
    name: "Certification readiness",
    footerLabel: "ISO certification in Uganda",
    query: "iso certification in uganda",
    metaTitle: "ISO Certification in Uganda for Organisations",
    metaDescription:
      "In-house ISO training and a free gap analysis for organisations in Uganda. NAM QMS prepares your team. An accredited body issues any certificate.",
    eyebrow: "For institutions and organisations",
    h1: "ISO certification in Uganda for organisations",
    lede:
      "ISO certification in Uganda is usually a leadership decision: a buyer, a donor, a hospital board or a tender has asked for evidence that the organisation runs a managed system. NAM QMS works with that organisation. We train the team in-house, carry out a free ISO gap analysis, and prepare the system so a certification body can audit it. We do not sell a personal certificate to an individual, and we do not issue ISO certificates.",
    sections: [
      {
        heading: "Start with the team that will live with the system",
        paragraphs: [
          "An institution is ready only when its own people can explain the processes, show the records and close the findings. That is why in-house training comes first. We train quality, environmental, health and safety, information-security or regulatory staff at your premises, or at a venue in Kampala when the team needs to step away from the working day. The same offer exists as a published group booking on the [[/internal-auditor-courses|Internal Auditor Courses page]], which is where that programme's fee is shown.",
          "Scheduled Lead Auditor fees stay on the course pages for " +
            courseLink(
              "ISO 9001",
              LEAD_AUDITOR_COURSE_PAGES.iso9001.path,
            ) +
            ", " +
            courseLink(
              "ISO 14001",
              LEAD_AUDITOR_COURSE_PAGES.iso14001.path,
            ) +
            ", " +
            courseLink(
              "ISO 27001",
              LEAD_AUDITOR_COURSE_PAGES.iso27001.path,
            ) +
            " and " +
            courseLink(
              "ISO 45001",
              LEAD_AUDITOR_COURSE_PAGES.iso45001.path,
            ) +
            ". Organisations book seats for their staff. No ISO 13485 course fee is published; device teams start with in-house training.",
        ],
      },
      {
        heading: "Use a free ISO gap analysis to decide the scope",
        paragraphs: [
          "The free ISO gap analysis compares how you work today with the standard you are considering. It names what is already in place and what still needs training, documents or records. It is a briefing for management, not an audit and not a certificate. Tell us the standard, the sites and who owns the system. We will say whether the next step is team training, documentation, or both.",
        ],
      },
      {
        heading: "What certification readiness actually is",
        paragraphs: [
          NOT_A_BODY +
            " Readiness, in our work, means the scope is agreed, the documented system matches real practice, internal audits have been run by people you trained, and management has reviewed the results. A course completion certificate from a training programme is not an ISO certificate.",
          "Choose the standard that matches the obligation in front of you. Quality, environment, information security, occupational health and safety, and medical devices are different systems. They can share habits such as document control and management review, but they should not be treated as one product.",
        ],
      },
      {
        heading: "Five guides for organisations in Uganda",
        paragraphs: [
          "[[/iso-9001-certification-uganda|ISO 9001 certification in Uganda]] is the quality management route for organisations that need consistent processes and a system a customer or tender can recognise. It is the usual base when no narrower standard applies.",
          "[[/iso-14001-certification-uganda|ISO 14001 certification in Uganda]] is for organisations that must show they understand their environmental aspects and legal obligations, and that they control them.",
          "[[/iso-27001-certification-uganda|ISO 27001 certification in Uganda]] is for organisations that hold other people's information and need an information security management system, not a one-off IT project.",
          "[[/iso-45001-certification-uganda|ISO 45001 for organisations]] covers occupational health and safety readiness, including an ISO 45001 lead auditor course for the people who will audit that system.",
          "[[/iso-13485-certification-uganda|Preparing for ISO 13485 certification in Uganda]] is for organisations in the medical-device chain: design, manufacture, storage, distribution, installation or servicing. It is not a general quality badge for every hospital department.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is NAM QMS a certification body?",
        a: "No. NAM QMS provides training and consulting for organisations. An independent accredited certification body carries out the certification audit and issues any ISO certificate. A certificate of completion from a NAM QMS course is evidence of training, not an ISO certificate.",
      },
      {
        q: "Are these pages for individual candidates?",
        a: "No. They are written for institutions and organisations that need their own staff trained and their management system prepared. Scheduled course fees are published on the course pages so a team can book seats. Personal career advice is not the offer.",
      },
      {
        q: "What does the free ISO gap analysis include?",
        a: "We look at current practice against the standard you name, and we tell you what is already covered and what still needs training, documents or records. There is no charge for that first analysis. It does not replace the certification body's audit.",
      },
      {
        q: "Which standards can you help a Ugandan organisation prepare for?",
        a: "ISO 9001, ISO 14001, ISO 27001, ISO 45001 and ISO 13485, on their own or, where the structure is shared, alongside each other. Food safety and privacy consulting remain on their own pages.",
      },
      {
        q: "Where do we see prices?",
        a: "Lead Auditor fees are on each course page. The Internal Auditor Courses page shows that programme's group fee. In-house training and consulting are quoted after the gap analysis, once the standard, the sites and the team size are known. We do not publish a single consulting price.",
      },
      {
        q: "Can training happen at our premises?",
        a: "Yes. In-house delivery is the usual route for institutions anywhere in Uganda. A Kampala venue is available when the team needs to train away from daily operations. Ask for that when you book the gap analysis or the internal-audit training.",
      },
    ],
    closing:
      "If your organisation is weighing ISO certification in Uganda, book the free gap analysis. We will say which standard fits and what must be true before a certification body is invited.",
    image: IMG.heroRoadmap,
    courseLinkLabel: "ISO certification in Uganda for organisations",
    serviceName: "ISO training and certification readiness for organisations in Uganda",
    serviceType: "ISO management system training and certification readiness",
    gapAnalysisHref: GAP_ANALYSIS_URL,
  },
  {
    kind: "standard",
    path: "/iso-9001-certification-uganda",
    code: "ISO 9001",
    name: "Quality management",
    footerLabel: "ISO 9001 in Uganda",
    query: "iso 9001 certification in uganda",
    metaTitle: "ISO 9001 Certification in Uganda for Organisations",
    metaDescription:
      "Prepare your organisation for ISO 9001 certification in Uganda with in-house team training, a free gap analysis and audit readiness from NAM QMS.",
    eyebrow: "Quality management for organisations",
    h1: "ISO 9001 certification in Uganda for organisations",
    lede:
      "ISO 9001 certification in Uganda matters when a customer, a donor or a tender wants evidence that an organisation controls the way it delivers work. NAM QMS helps institutions build that evidence: we train the team, run a free gap analysis, and prepare the quality management system for an independent audit. The certificate, if it is issued, comes from an accredited certification body.",
    sections: [
      {
        heading: "Train the people who own the processes",
        paragraphs: [
          "A quality manual that staff have never used will not survive an audit interview. We therefore lead with team training. Internal auditors, process owners and the management representative learn how ISO 9001 expects planning, operation, documented information and improvement to work in your organisation, not in a generic factory. Delivery is in-house, or at a Kampala venue. The outline for company internal-audit training is on the [[/internal-audit-training|internal audit training page]].",
          "Where a leadership team wants the longer Lead Auditor programme, book the published " +
            courseLink(
              LEAD_AUDITOR_COURSE_PAGES.iso9001.title,
              LEAD_AUDITOR_COURSE_PAGES.iso9001.path,
            ) +
            ". The fee is on that course page, including the team rate. Do not treat a course completion certificate as ISO 9001 certification. It shows the person attended the training.",
        ],
      },
      {
        heading: "A free gap analysis before documents are rewritten",
        paragraphs: [
          "Many organisations already have procedures, work instructions and records. Some of them match ISO 9001 and some of them describe a process that stopped being true years ago. The free ISO gap analysis sorts those two piles. We look at context, interested parties, the scope of the quality system, process controls, competence, internal audit and management review, and we say what is missing.",
          "That briefing is how leadership chooses a scope it can actually defend: one site or several, which products and services, and which support processes. Consulting to close the gaps is quoted afterwards. We do not publish a flat implementation fee, because the amount of work depends on what the analysis finds.",
        ],
      },
      {
        heading: "Certification readiness, without pretending we certify you",
        paragraphs: [
          NOT_A_BODY +
            " For ISO 9001, ready means the quality policy and objectives belong to this organisation, processes are controlled where the work happens, people are competent for those processes, and internal audits have tested the system. Corrective action has owners. Management review has looked at audit results, customer feedback and whether the objectives are still the right ones.",
          "ISO 9001 is a management-system standard. It is not a product mark and it does not replace product or service approvals that a regulator or a buyer requires separately. Organisations that make, distribute or service medical devices should use the ISO 13485 guide instead of assuming a general quality system is the right scope.",
        ],
      },
      {
        heading: "How a quality system connects to the other standards",
        paragraphs: [
          "ISO 9001 shares a high-level structure with [[/iso-14001-certification-uganda|ISO 14001]] and [[/iso-45001-certification-uganda|ISO 45001]]. Document control, internal audit and management review can serve more than one standard when the organisation is honest about the different risks. [[/iso-27001-certification-uganda|ISO 27001]] is a different system, aimed at information security. Keep the scopes distinct even when one team coordinates them.",
          "The wider set of guides sits on the [[/iso-certification-uganda|ISO certification in Uganda]] hub. Consulting detail for this standard also lives on the [[/certifications/iso-9001|ISO 9001 consulting page]].",
        ],
      },
    ],
    faqs: [
      {
        q: "Does NAM QMS issue an ISO 9001 certificate?",
        a: "No. NAM QMS trains your team and prepares the quality management system. An independent accredited certification body audits the system and decides whether to issue the certificate.",
      },
      {
        q: "Who is this for?",
        a: "Organisations and institutions in Uganda: manufacturers, contractors, universities, hospitals, NGOs, utilities and suppliers that need a quality management system. It is not a page for someone seeking a personal credential only.",
      },
      {
        q: "Where is the Lead Auditor course fee?",
        a: "On the ISO 9001:2015 Lead Auditor course page. Internal Auditor Courses show their own group fee on that page. In-house training is quoted from the team size, the standard and the venue.",
      },
      {
        q: "Is ISO 9001 the same as a product certification mark?",
        a: "No. ISO 9001 certifies a management system after an audit by a certification body. Product marks and statutory product approvals are separate decisions by the bodies that own those schemes.",
      },
      {
        q: "Can our own staff become the internal auditors?",
        a: "Yes. That is the point of the in-house training. Your staff plan the audit programme, audit processes they do not own, and report findings into corrective action and management review.",
      },
      {
        q: "What should we have in place before a certification body visits?",
        a: "An agreed scope, a system people actually use, completed internal audits, and a management review of the results. The gap analysis tells you which of those are still open. The certification body will make its own assessment.",
      },
    ],
    closing:
      "Book a free ISO gap analysis if your organisation is preparing for ISO 9001 certification in Uganda. We will show you the training and the system work that still sit between today and an audit by a certification body.",
    image: IMG.qmsImplementation,
    courseLinkLabel: "preparing your organisation for ISO 9001 certification in Uganda",
    serviceName: "ISO 9001 team training and certification readiness",
    serviceType: "ISO 9001 quality management training and readiness",
    gapAnalysisHref: GAP_ANALYSIS_URL,
  },
  {
    kind: "standard",
    path: "/iso-14001-certification-uganda",
    code: "ISO 14001",
    name: "Environmental management",
    footerLabel: "ISO 14001 in Uganda",
    query: "iso 14001 certification in uganda",
    metaTitle: "ISO 14001 Certification in Uganda for Organisations",
    metaDescription:
      "Prepare your organisation for ISO 14001 certification in Uganda. In-house environmental training, a free gap analysis and audit readiness from NAM QMS.",
    eyebrow: "Environmental management for organisations",
    h1: "ISO 14001 certification in Uganda for organisations",
    lede:
      "ISO 14001 certification in Uganda is a question for organisations whose clients, financiers or neighbours expect a controlled approach to environmental impact. NAM QMS trains the team that will run the environmental management system, starts with a free gap analysis, and prepares the organisation for an audit. We do not issue the certificate.",
    sections: [
      {
        heading: "In-house training for the environmental team",
        paragraphs: [
          "Environmental control fails when it lives in a consultant's folder and not with the people who handle waste, fuel, water, chemicals and contractors. We train those people in-house: how to describe environmental aspects, how to tell a significant impact from a minor one, and how an internal audit checks operational control rather than paperwork alone. Company delivery is described on the [[/internal-audit-training|internal audit training page]].",
          "Staff who will lead audits of the environmental system can join the published " +
            courseLink(
              LEAD_AUDITOR_COURSE_PAGES.iso14001.title,
              LEAD_AUDITOR_COURSE_PAGES.iso14001.path,
            ) +
            ". The current fee is on that course page. Book it for your organisation's team. A seat on a course does not make the organisation certified.",
        ],
      },
      {
        heading: "Free gap analysis of aspects, obligations and controls",
        paragraphs: [
          "The free ISO gap analysis for ISO 14001 looks at whether you know your environmental aspects, whether compliance obligations are identified and evaluated, and whether objectives and operational controls exist for the impacts that matter. Emergency preparedness is part of that picture when spills, fires or releases are realistic for your sites.",
          "ISO 14001 does not replace permits, licences or statutory environmental duties. A management system is how an organisation keeps track of those duties and shows that it acts on them. The gap analysis will not tell a regulator that you are compliant. It tells your leadership what the system still lacks before a certification body is invited.",
        ],
      },
      {
        heading: "Readiness for an environmental certification audit",
        paragraphs: [
          NOT_A_BODY +
            " For this standard, ready means the scope names the sites and activities that create environmental impact, the aspects and impacts assessment is current, people who operate controls have been trained, and internal audits have sampled real activities such as waste storage, effluent, emissions and contractor work. Management review has considered incidents, obligations and whether objectives are being met.",
          "Manufacturing, construction, processing, logistics, energy services and institutions with significant campuses are typical organisations. A policy statement on a website is not a system. The auditors, whoever the certification body sends, will ask to see the yard, the stores and the records.",
        ],
      },
      {
        heading: "Environment beside quality and safety",
        paragraphs: [
          "Organisations that already run [[/iso-9001-certification-uganda|ISO 9001]] often add ISO 14001 rather than building a second, unrelated bureaucracy. The shared structure covers leadership, planning and improvement. The environmental content — aspects, obligations, operational control — stays specific. Occupational health and safety belongs on the [[/iso-45001-certification-uganda|ISO 45001]] guide, even when one HSE team covers both.",
          "Return to the [[/iso-certification-uganda|ISO certification in Uganda]] hub to compare standards, or read the [[/certifications/iso-14001|ISO 14001 consulting page]] for the implementation services we already describe there.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does NAM QMS issue ISO 14001 certificates?",
        a: "No. NAM QMS is not a certification body. We train your team and prepare the environmental management system. An accredited certification body issues the certificate after its own audit.",
      },
      {
        q: "Does ISO 14001 replace our environmental permits?",
        a: "No. Permits and other legal duties remain in force. ISO 14001 is a voluntary management system that helps an organisation identify those obligations, work to them and keep evidence. It is not a permit.",
      },
      {
        q: "Who should attend the training?",
        a: "People who operate environmental controls, the internal auditors who will check them, and the managers who set objectives. We train organisational teams, in-house or on a scheduled course, rather than marketing a personal certificate.",
      },
      {
        q: "Where is the course fee?",
        a: "The ISO 14001:2015 Lead Auditor fee is on that course page. Internal auditor group fees are on the Internal Auditor Courses page. In-house environmental training is quoted after we know the sites and the size of the team.",
      },
      {
        q: "What will the free gap analysis look at?",
        a: "Your aspects and impacts, compliance obligations, objectives, operational controls, emergency preparedness, internal audit and management review. You leave with a practical list, not with a certificate.",
      },
      {
        q: "Can ISO 14001 sit in the same system as ISO 9001?",
        a: "Yes, when the organisation wants an integrated system. Shared processes such as document control and management review can serve both standards. Environmental aspects still need their own assessment and controls.",
      },
    ],
    closing:
      "If your organisation needs ISO 14001 certification in Uganda, start with the free gap analysis. We will show the environmental team what to train, what to document, and what a certification body will expect to see on site.",
    image: IMG.implementationTraining,
    courseLinkLabel:
      "preparing your organisation for ISO 14001 certification in Uganda",
    serviceName: "ISO 14001 team training and certification readiness",
    serviceType: "ISO 14001 environmental management training and readiness",
    gapAnalysisHref: GAP_ANALYSIS_URL,
  },
  {
    kind: "standard",
    path: "/iso-27001-certification-uganda",
    code: "ISO 27001",
    name: "Information security",
    footerLabel: "ISO 27001 in Uganda",
    query: "iso 27001 certification in uganda",
    metaTitle: "ISO 27001 Certification in Uganda for Organisations",
    metaDescription:
      "Prepare your organisation for ISO 27001 certification in Uganda. In-house ISMS training, a free gap analysis and audit readiness from NAM QMS.",
    eyebrow: "Information security for organisations",
    h1: "ISO 27001 certification in Uganda for organisations",
    lede:
      "ISO 27001 certification in Uganda is how banks, universities, hospitals, public agencies, NGOs and technology firms show that information security is a managed system rather than a pile of tools. NAM QMS trains the team that will run that system, offers a free gap analysis, and prepares the organisation for an independent audit. We are not the body that issues the certificate.",
    sections: [
      {
        heading: "Train the team that owns the ISMS",
        paragraphs: [
          "An information security management system fails when only the IT supplier understands it. We train the organisation's own people: the staff who classify information, approve access, manage suppliers, respond to incidents and audit the controls. In-house delivery uses your processes and your sites. The company format is set out on the [[/internal-audit-training|internal audit training page]].",
          "For staff who need the full Lead Auditor programme, use the published " +
            courseLink(
              LEAD_AUDITOR_COURSE_PAGES.iso27001.title,
              LEAD_AUDITOR_COURSE_PAGES.iso27001.path,
            ) +
            ". The fee for an individual seat and for a team is on that course page. Send the people who will audit your ISMS. Passing a course is not ISO 27001 certification of the organisation.",
        ],
      },
      {
        heading: "A free gap analysis of scope, risk and controls",
        paragraphs: [
          "The free ISO gap analysis starts with scope. Which information, which systems, which sites and which suppliers are inside the ISMS, and which are honestly outside it? We then look at whether risks are assessed, whether a treatment plan exists, and whether the controls you claim are the ones people follow. Policies that nobody has read are recorded as gaps, not as comfort.",
          "We will not invent a risk score for you on this page, and we will not tell you that a tool, a firewall or a policy template is enough. The analysis is a conversation with the people who run the organisation. Consulting to close the gaps is quoted from what we find.",
        ],
      },
      {
        heading: "What ready means before a certification body arrives",
        paragraphs: [
          NOT_A_BODY +
            " Readiness for ISO 27001 means the scope is written down, leadership has assigned responsibility, the risk assessment and the statement of applicability match the controls you operate, internal audits have tested those controls, and management review has seen incidents, audit results and changes in risk. Evidence is records of what you do, not a slide deck produced for the visit.",
          "ISO 27001 does not certify a software product, a data centre you do not operate, or a promise that a breach can never happen. It certifies that the organisation's system for managing information-security risk meets the standard, and only the certification body makes that decision. Privacy extensions are a separate conversation; see the [[/certifications/iso-27701|ISO 27701 consulting page]] if personal-data governance is the actual request.",
        ],
      },
      {
        heading: "Where this sits among the other Uganda guides",
        paragraphs: [
          "Quality, environment and safety systems do not replace an ISMS. If a tender asks for several standards, read [[/iso-9001-certification-uganda|ISO 9001]] and [[/iso-45001-certification-uganda|ISO 45001]] as their own scopes and keep information security defined on its own. Medical-device organisations that also hold patient or device data may need both this system and [[/iso-13485-certification-uganda|ISO 13485]]. They are not interchangeable.",
          "The [[/iso-certification-uganda|ISO certification in Uganda]] hub compares all five. Implementation services we already offer are on the [[/certifications/iso-27001|ISO 27001 consulting page]].",
        ],
      },
    ],
    faqs: [
      {
        q: "Does NAM QMS issue ISO 27001 certificates?",
        a: "No. NAM QMS trains teams and prepares the information security management system. An independent accredited certification body performs the audit and issues the certificate.",
      },
      {
        q: "Is ISO 27001 a certificate for our software or our website?",
        a: "No. The certificate, when a certification body issues one, covers the organisation's ISMS within the agreed scope. It is not a product test report and it is not a promise that an incident is impossible.",
      },
      {
        q: "Who should be trained?",
        a: "The people who will operate and audit the ISMS: information-security and IT leads, risk and compliance officers, and the managers who approve access and suppliers. We train organisational teams. This is not an individual career page.",
      },
      {
        q: "Where do we see the course price?",
        a: "On the ISO 27001:2022 Lead Auditor course page. That page is the source for the current fee. In-house ISMS training is quoted after the gap analysis, based on scope and team size.",
      },
      {
        q: "What does the free gap analysis cover?",
        a: "Scope, leadership and responsibilities, risk assessment and treatment, the controls you say you operate, internal audit and management review. You receive a practical picture of the gaps. You do not receive a certificate.",
      },
      {
        q: "We already have ISO 9001. Do we still need a separate ISMS?",
        a: "Yes, if the requirement is information security. A quality system does not assess information-security risk or select security controls. The two systems can share document control and management review, but the ISMS scope has to be its own.",
      },
    ],
    closing:
      "Book a free gap analysis if your organisation is working toward ISO 27001 certification in Uganda. We will identify who needs training and which parts of the ISMS are not yet ready for a certification body.",
    image: IMG.leadAuditorTraining,
    courseLinkLabel:
      "preparing your organisation for ISO 27001 certification in Uganda",
    serviceName: "ISO 27001 team training and certification readiness",
    serviceType: "ISO 27001 information security training and readiness",
    gapAnalysisHref: GAP_ANALYSIS_URL,
  },
  {
    kind: "standard",
    path: "/iso-45001-certification-uganda",
    code: "ISO 45001",
    name: "Occupational health and safety",
    footerLabel: "ISO 45001 in Uganda",
    query: "iso 45001 lead auditor course",
    metaTitle: "ISO 45001 Training and Readiness in Uganda",
    metaDescription:
      "In-house ISO 45001 training for organisations in Uganda, including the lead auditor course, plus a free gap analysis. NAM QMS does not issue certificates.",
    eyebrow: "Health and safety for organisations",
    h1: "ISO 45001 readiness for organisations in Uganda",
    lede:
      "Occupational health and safety certification is an organisational task: hazards sit on sites, in workshops and on contracts, and the people who control them are your employees and contractors. NAM QMS trains that team, including through an ISO 45001 lead auditor course when your auditors need it, and we prepare the management system. An accredited certification body, not NAM QMS, decides whether to certify it.",
    sections: [
      {
        heading: "ISO 45001 lead auditor course",
        paragraphs: [
          "An ISO 45001 lead auditor course gives your health and safety team a shared method for planning an audit, sampling hazardous work, interviewing workers and writing findings a manager can act on. The scheduled course is the " +
            courseLink(
              LEAD_AUDITOR_COURSE_PAGES.iso45001.title,
              LEAD_AUDITOR_COURSE_PAGES.iso45001.path,
            ) +
            " already listed on this site. Organisations book seats for their staff. The fee, and the team rate, are published on that course page and nowhere else, so we are not restating a price here.",
          "A lead auditor course is training. It does not certify your sites, and a course completion record is not an ISO 45001 certificate. Many institutions also need shorter in-house internal-audit training for supervisors who will audit their own projects. That format is on the [[/internal-audit-training|internal audit training page]], and the published group booking is on the [[/internal-auditor-courses|Internal Auditor Courses page]].",
        ],
      },
      {
        heading: "In-house training where the hazards are",
        paragraphs: [
          "Construction firms, manufacturers, hospitals, logistics companies, universities and contractors learn more when the exercises use their own permits, their own incident reports and their own contractor controls. We deliver that training at your premises anywhere in Uganda, or in Kampala if you want the team off site. Worker participation is part of the standard, so the room should include people who do the work, not only head-office staff.",
          "Legal duties under occupational safety and health law are separate from certification. ISO 45001 does not replace those duties. It is a way to identify hazards, control risks and show that the organisation reviews the results. We do not offer legal advice, and we do not claim that a certificate changes a statutory obligation.",
        ],
      },
      {
        heading: "Free gap analysis, then certification readiness",
        paragraphs: [
          "The free ISO gap analysis looks at how you identify hazards, how you apply controls, how workers are consulted, how incidents are investigated, and whether internal audits reach the dangerous jobs rather than the tidy offices. Emergency preparedness and contractor management are usually where the gaps are. You get a prioritised picture, not a certificate.",
          NOT_A_BODY +
            " Ready, for this standard, means the scope includes the sites and activities where people can be harmed, risk assessments are current, controls are in use, internal audits have been completed by trained staff, and management review has looked at incidents and worker feedback. Then a certification body can do its own audit.",
        ],
      },
      {
        heading: "Safety beside the other management systems",
        paragraphs: [
          "ISO 45001 shares a structure with [[/iso-9001-certification-uganda|ISO 9001]] and [[/iso-14001-certification-uganda|ISO 14001]]. One integrated system can hold quality, environment and safety when each discipline still has its own risks and controls. Do not fold health and safety into a quality procedure and call it done. Information security is [[/iso-27001-certification-uganda|ISO 27001]]. Device quality is [[/iso-13485-certification-uganda|ISO 13485]].",
          "Compare the set on the [[/iso-certification-uganda|ISO certification in Uganda]] hub. The existing [[/certifications/iso-45001|ISO 45001 consulting page]] describes implementation support in more detail.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is the ISO 45001 lead auditor course the same as certifying our company?",
        a: "No. The course trains people, usually staff an organisation sends. ISO 45001 certification of the organisation is a later audit by an independent certification body. NAM QMS does not issue that certificate.",
      },
      {
        q: "Where is the lead auditor course fee?",
        a: "On the ISO 45001:2018 Lead Auditor course page. Use that page for the current individual and team fees. In-house internal-audit training is quoted separately once we know the group size and the venue.",
      },
      {
        q: "Can the course be delivered to our team only?",
        a: "Yes. In-house training at your premises is the usual request from institutions. The scheduled lead auditor course is the public alternative when you want staff to join the published cohort. Both are team decisions, not a personal marketing offer.",
      },
      {
        q: "Does ISO 45001 replace the Occupational Safety and Health Act?",
        a: "No. Statutory health and safety duties stand on their own. ISO 45001 is a voluntary management system. Many organisations use it to structure how they meet those duties and how they show evidence to clients.",
      },
      {
        q: "What does the free gap analysis check?",
        a: "Hazard identification, risk controls, worker participation, incident handling, contractor control, emergency preparedness, internal audit and management review. It prepares a work list. It is not a certification audit.",
      },
      {
        q: "Who should attend from our organisation?",
        a: "Health and safety officers, site supervisors, internal auditors and the managers who will be interviewed at an external audit. Include people from the hazardous work, not only the compliance office.",
      },
    ],
    closing:
      "Put your team on the ISO 45001 lead auditor course, or ask for in-house training, and book the free gap analysis so the organisation knows what else must be true before a certification body visits.",
    image: IMG.leadAuditorTraining,
    courseLinkLabel: "ISO 45001 readiness and the lead auditor course for your team",
    serviceName: "ISO 45001 team training and certification readiness",
    serviceType: "ISO 45001 occupational health and safety training and readiness",
    gapAnalysisHref: GAP_ANALYSIS_URL,
  },
  {
    kind: "standard",
    path: "/iso-13485-certification-uganda",
    code: "ISO 13485",
    name: "Medical devices",
    footerLabel: "ISO 13485 in Uganda",
    query: "iso 13485 certification in uganda",
    metaTitle: "ISO 13485 Certification in Uganda for Organisations",
    metaDescription:
      "Preparing for ISO 13485 certification in Uganda: in-house training and a free gap analysis for medical-device organisations. NAM QMS does not issue certificates.",
    eyebrow: "Medical devices — for organisations",
    h1: "Preparing for ISO 13485 certification in Uganda",
    lede:
      "Preparing for ISO 13485 certification in Uganda is a step for organisations in the medical-device chain, not a general badge for every clinic and not a personal credential. NAM QMS trains the team that designs, makes, stores, distributes, installs or services devices, and we prepare the quality system for an independent audit. We do not issue ISO 13485 certificates.",
    sections: [
      {
        heading: "Who the standard is actually for",
        paragraphs: [
          "ISO 13485 is a quality management system for medical devices and related services. It fits manufacturers, importers, distributors, organisations that install or service devices, and suppliers whose work affects device quality. A hospital department that only treats patients is not automatically in scope. A workshop that refurbishes devices, or a distributor that stores and traces them, may be. The free gap analysis is where we agree the honest scope before anyone writes procedures.",
          "Regulatory duties for devices are separate from certification. We will not tell you that an ISO 13485 certificate replaces product registration, import permission or a buyer's own technical requirements. Those obligations stay with the authorities and the customers that impose them. The management system is how your organisation shows it can meet the requirements that apply to its role.",
        ],
      },
      {
        heading: "In-house training for device quality teams",
        paragraphs: [
          "There is no ISO 13485 Lead Auditor course published on this website, so we will not invent a fee for one. Team training is arranged in-house. We teach the people who will run the system: regulatory and quality staff, warehouse and distribution leads, complaint handlers, and internal auditors. The company format is described on the [[/internal-audit-training|internal audit training page]]. A quoted in-house programme follows the gap analysis, once the roles and the sites are known.",
          `The only published quality Lead Auditor fee on this site is on the [[${LEAD_AUDITOR_COURSE_PAGES.iso9001.path}|ISO 9001:2015 Lead Auditor course page]], and that course is not ISO 13485. Internal auditor group fees are on the [[/internal-auditor-courses|Internal Auditor Courses page]].`,
        ],
      },
      {
        heading: "How ISO 13485 differs from a general quality system",
        paragraphs: [
          "ISO 13485 asks for a quality system aimed at regulatory requirements and device safety. Traceability, complaint handling, advisory notices and control of suppliers are central. Design controls apply only when design is inside your scope, not for a distributor that never designs a device.",
          "Organisations sometimes arrive with [[/iso-9001-certification-uganda|ISO 9001]] and assume the same manual will do. The structure is familiar, and document control, internal audit and management review transfer. The device-specific requirements do not. The gap analysis marks that difference so you do not pay to rename a general quality system.",
        ],
      },
      {
        heading: "Readiness before a certification body is invited",
        paragraphs: [
          NOT_A_BODY +
            " For medical devices, ready means the scope states your role in the device lifecycle, procedures match that role, records show traceability and complaint handling, suppliers that affect quality are controlled, and internal auditors from your team have tested the system. Management review has seen those results, including any advisory notices or complaints that matter.",
          "When that is true, approach an accredited certification body that audits ISO 13485. NAM QMS can help the team prepare. The certification decision stays with the body. Other guides are on the [[/iso-certification-uganda|ISO certification in Uganda]] hub, including [[/iso-27001-certification-uganda|information security]] where a tender asks for it.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does NAM QMS issue ISO 13485 certificates?",
        a: "No. NAM QMS provides training and certification-readiness support. An independent accredited certification body audits a medical-device quality management system and issues any certificate.",
      },
      {
        q: "Is every hospital supposed to hold ISO 13485?",
        a: "No. The standard applies to organisations involved in the design, manufacture, storage, distribution, installation or servicing of a medical device, and to suppliers that affect device quality. Clinical care on its own is a different question. The gap analysis is how we confirm whether your organisation is in scope.",
      },
      {
        q: "Why is there no ISO 13485 price on this page?",
        a: "This site does not publish an ISO 13485 course fee. In-house training and consulting are quoted after the free gap analysis. The ISO 9001 Lead Auditor course page shows that course's fee only, and it is a different standard.",
      },
      {
        q: "How is ISO 13485 different from ISO 9001?",
        a: "ISO 9001 is a general quality management system. ISO 13485 is written for medical devices and regulatory expectations: traceability, complaint handling, advisory notices and, where relevant, design controls. A general quality certificate is not a device-quality certificate.",
      },
      {
        q: "What does the free gap analysis cover for devices?",
        a: "Your role in the device chain, the scope that role implies, the records you already keep, supplier control, complaint handling and internal audit. You receive a work list for training and documents. You do not receive a certificate.",
      },
      {
        q: "Can our distributors and warehouse staff be trained together?",
        a: "Yes, when they are part of the same organisational system. In-house training is built around the procedures those teams will have to follow and audit. We train the institution's people, not anonymous individual candidates.",
      },
    ],
    closing:
      "If your organisation is preparing for ISO 13485 certification in Uganda, book the free gap analysis. We will confirm the scope, train the team in-house, and show you what still has to be true before a certification body audits the system.",
    image: IMG.qmsImplementation,
    courseLinkLabel: "preparing for ISO 13485 certification in Uganda",
    serviceName: "ISO 13485 team training and certification readiness",
    serviceType: "ISO 13485 medical device quality training and readiness",
    gapAnalysisHref: GAP_ANALYSIS_URL,
  },
];

export const UGANDA_ISO_PAGES: readonly UgandaIsoPage[] = pages;

const byPath = new Map(pages.map((page) => [page.path, page]));

export function getUgandaIsoPage(path: string): UgandaIsoPage {
  const page = byPath.get(path);
  if (!page) {
    throw new Error(`Unknown Uganda ISO page: ${path}`);
  }
  return page;
}

export const UGANDA_ISO_STANDARDS = pages.filter(
  (page) => page.kind === "standard",
);

export function ugandaIsoSitemapPaths(): string[] {
  return pages.map((page) => page.path);
}

/** Match a scheduled course to the organisational guide, or the hub. */
export function ugandaIsoPageForCourse(course: {
  title: string;
  standard?: string | null;
}): UgandaIsoPage {
  const hay = `${course.standard ?? ""} ${course.title}`.toLowerCase();
  const order = ["13485", "27001", "14001", "45001", "9001"];
  for (const token of order) {
    if (hay.includes(token)) {
      const match = UGANDA_ISO_STANDARDS.find((page) =>
        page.code.includes(token),
      );
      if (match) return match;
    }
  }
  return getUgandaIsoPage(UGANDA_ISO_HUB_PATH);
}

export function ugandaIsoPageForStandardSlug(
  slug: string,
): UgandaIsoPage | undefined {
  return UGANDA_ISO_STANDARDS.find(
    (page) => page.path === `/${slug}-certification-uganda`,
  );
}

const LINK_MARKUP = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;

/** Visible wording with link markup removed, for word counts and checks. */
export function ugandaIsoPlainText(page: UgandaIsoPage): string {
  const parts = [
    page.h1,
    page.lede,
    ...page.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets ?? []),
    ]),
    ...page.faqs.flatMap((faq) => [faq.q, faq.a]),
    page.closing,
  ];
  return parts
    .join(" ")
    .replace(LINK_MARKUP, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

export function ugandaIsoWordCount(page: UgandaIsoPage): number {
  return ugandaIsoPlainText(page).split(" ").filter(Boolean).length;
}

export function ugandaIsoHeadings(page: UgandaIsoPage): string {
  return [page.h1, ...page.sections.map((section) => section.heading)]
    .join(" ")
    .toLowerCase();
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_LEGAL_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: abs("/nam-qms-logo.png"),
      width: 1280,
      height: 586,
    },
    description:
      "ISO certification consulting and Lead Auditor training across Uganda and East Africa.",
    email: CONTACT.email,
    telephone: CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kampala",
      addressCountry: "UG",
    },
    areaServed: ["Uganda", "East Africa"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: "sales",
      areaServed: "UG",
    },
  };
}

export function ugandaIsoJsonLd(page: UgandaIsoPage) {
  const pageUrl = abs(page.path);
  const organization = organizationJsonLd();
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.serviceName,
    serviceType: page.serviceType,
    url: pageUrl,
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: { "@type": "Country", name: "Uganda" },
    audience: {
      "@type": "Audience",
      audienceType: "Organisations and institutions in Uganda",
    },
    description: page.metaDescription,
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
    {
      "@type": "ListItem",
      position: 2,
      name: "ISO certification in Uganda",
      item: abs(UGANDA_ISO_HUB_PATH),
    },
  ];
  if (page.kind === "standard") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: page.code,
      item: pageUrl,
    });
  }
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };
  return { organization, service, faq, breadcrumb };
}
