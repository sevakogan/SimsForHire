/**
 * Non-Disclosure Agreement content — one-sided NDA protecting SimsForHire.
 * Rendered as a beautiful UI on the NDA page. Structured data so the UI
 * can render with proper formatting, numbering, and emphasis.
 */

export interface NdaSubItem {
  id: string;
  text: string;
  bold?: string;
}

export interface NdaClause {
  id: string;
  text: string;
  bold?: string;
  subItems?: NdaSubItem[];
}

export interface NdaSection {
  number: number;
  title: string;
  clauses: NdaClause[];
}

export const NDA_HEADER = {
  company: "SIMSFORHIRE",
  division: "A Division of LevelSim LLC Holdings",
  title: "NON-DISCLOSURE AGREEMENT",
  preamble:
    'This Non-Disclosure Agreement ("Agreement") is entered into by and between SimsForHire, a trade name of LevelSim LLC Holdings, a Wyoming limited liability company with its principal place of business in Miami, Florida ("Company" or "Disclosing Party"), and the individual or entity identified below ("Receiving Party" or "Contractor"). By executing this Agreement, the Receiving Party acknowledges and agrees to be bound by all terms and conditions set forth herein.',
};

export const NDA_SECTIONS: NdaSection[] = [
  {
    number: 1,
    title: "Definitions",
    clauses: [
      {
        id: "1.1",
        text: '"Confidential Information" means any and all non-public information, whether disclosed orally, in writing, electronically, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, without limitation, the following:',
        bold: "Confidential Information",
        subItems: [
          {
            id: "a",
            text: "Event and venue information, including but not limited to the locations, addresses, and sites where events, gigs, activations, or any Company-contracted engagements take place, as well as the identity of venue operators and site contacts;",
            bold: "locations, addresses, and sites where events, gigs, activations, or any Company-contracted engagements take place",
          },
          {
            id: "b",
            text: "Financial information, including but not limited to Company revenue, gross and net income, profit margins, pricing structures, rate cards, fee schedules, cost of goods sold, overhead figures, and any other business numbers or financial data;",
            bold: "Company revenue, gross and net income, profit margins, pricing structures, rate cards, fee schedules",
          },
          {
            id: "c",
            text: "Compensation information, including but not limited to salary, hourly rates, bonuses, commissions, profit-sharing arrangements, equity grants, and any other form of remuneration paid to the Receiving Party or to any other contractor, employee, or agent of the Company;",
            bold: "salary, hourly rates, bonuses, commissions, profit-sharing arrangements",
          },
          {
            id: "d",
            text: "Trade secrets, including proprietary processes, workflows, operational methods, logistics plans, scheduling systems, and technology configurations;",
          },
          {
            id: "e",
            text: "Client and customer lists, contact information, client preferences, engagement histories, and the terms of any agreements between the Company and its clients;",
          },
          {
            id: "f",
            text: "Business strategies, marketing plans, expansion plans, partnership discussions, and any other forward-looking business intelligence;",
          },
          {
            id: "g",
            text: "Software, source code, algorithms, databases, and any proprietary technology or intellectual property owned or licensed by the Company;",
          },
          {
            id: "h",
            text: "Any other information that the Company designates as confidential, whether or not marked as such at the time of disclosure.",
          },
        ],
      },
      {
        id: "1.2",
        text: '"Disclosing Party" refers exclusively to SimsForHire, a trade name of LevelSim LLC Holdings. This Agreement is one-sided and imposes confidentiality obligations solely upon the Receiving Party for the benefit and protection of the Company.',
        bold: "one-sided",
      },
      {
        id: "1.3",
        text: '"Receiving Party" means the individual or entity executing this Agreement who receives or has access to Confidential Information in the course of performing services for, or engaging in a business relationship with, the Company.',
      },
    ],
  },
  {
    number: 2,
    title: "Obligations of the Receiving Party",
    clauses: [
      {
        id: "2.1",
        text: "The Receiving Party shall hold all Confidential Information in strict confidence and shall not, directly or indirectly, disclose, publish, disseminate, or otherwise make available any Confidential Information to any third party without the prior written consent of the Company.",
        bold: "shall not, directly or indirectly, disclose, publish, disseminate, or otherwise make available any Confidential Information to any third party",
      },
      {
        id: "2.2",
        text: "The Receiving Party shall not use any Confidential Information for any purpose other than the performance of services for the Company. Without limiting the foregoing, the Receiving Party shall not use Confidential Information for personal benefit, competitive advantage, or for the benefit of any third party.",
        bold: "shall not use any Confidential Information for any purpose other than the performance of services for the Company",
      },
      {
        id: "2.3",
        text: "The Receiving Party shall protect Confidential Information using at least the same degree of care that the Receiving Party uses to protect its own confidential information of a similar nature, but in no event less than a reasonable degree of care.",
      },
      {
        id: "2.4",
        text: "The Receiving Party shall limit access to Confidential Information to those persons who have a need to know such information for the purposes contemplated by this Agreement, and who are bound by confidentiality obligations no less restrictive than those contained herein.",
      },
      {
        id: "2.5",
        text: "The Receiving Party shall not discuss, post on social media, or otherwise communicate to any person the specific locations where Company events take place, the identity of Company clients, the financial terms of any engagement, or the compensation received by the Receiving Party or any other individual associated with the Company.",
        bold: "shall not discuss, post on social media, or otherwise communicate",
      },
      {
        id: "2.6",
        text: "Upon termination of the relationship between the parties, or upon the Company's written request at any time, the Receiving Party shall promptly return or destroy all materials, documents, files, copies, notes, and any other tangible or electronic items containing or reflecting Confidential Information, and shall certify in writing that such return or destruction has been completed.",
        bold: "promptly return or destroy all materials",
      },
    ],
  },
  {
    number: 3,
    title: "Exclusions from Confidential Information",
    clauses: [
      {
        id: "3.1",
        text: "The obligations set forth in this Agreement shall not apply to information that the Receiving Party can demonstrate:",
        subItems: [
          {
            id: "a",
            text: "Was publicly available at the time of disclosure or becomes publicly available thereafter through no fault or action of the Receiving Party;",
          },
          {
            id: "b",
            text: "Was lawfully in the possession of the Receiving Party prior to disclosure by the Company, as evidenced by contemporaneous written records;",
          },
          {
            id: "c",
            text: "Was independently developed by the Receiving Party without reference to or use of any Confidential Information, as evidenced by contemporaneous written records;",
          },
          {
            id: "d",
            text: "Was disclosed to the Receiving Party by a third party who had a legal right to make such disclosure without restriction;",
          },
          {
            id: "e",
            text: "Is required to be disclosed by law, regulation, or valid court order, provided that the Receiving Party gives the Company prompt written notice of such requirement prior to disclosure (to the extent legally permitted) and cooperates with the Company in seeking a protective order or other appropriate remedy.",
            bold: "prompt written notice",
          },
        ],
      },
    ],
  },
  {
    number: 4,
    title: "Term and Termination",
    clauses: [
      {
        id: "4.1",
        text: "This Agreement shall become effective upon execution by the Receiving Party and shall remain in full force and effect for the duration of the relationship between the parties and thereafter as specified in this Section.",
      },
      {
        id: "4.2",
        text: "The Receiving Party's obligations with respect to trade secrets shall continue for as long as such information constitutes a trade secret under applicable law, which may be perpetual.",
        bold: "perpetual",
      },
      {
        id: "4.3",
        text: "The Receiving Party's obligations with respect to all other Confidential Information that does not constitute a trade secret shall survive for a period of three (3) years following the termination or expiration of the relationship between the parties, regardless of the reason for such termination.",
        bold: "three (3) years",
      },
      {
        id: "4.4",
        text: "Termination of this Agreement or the underlying business relationship shall not relieve the Receiving Party of any obligations incurred during the term of this Agreement with respect to Confidential Information received prior to the date of termination.",
      },
    ],
  },
  {
    number: 5,
    title: "Remedies",
    clauses: [
      {
        id: "5.1",
        text: "The Receiving Party acknowledges that any unauthorized disclosure or use of Confidential Information may cause irreparable harm to the Company for which monetary damages alone would be an inadequate remedy. Accordingly, the Company shall be entitled to seek injunctive relief, specific performance, or other equitable remedies in any court of competent jurisdiction, without the necessity of posting a bond or proving actual damages.",
        bold: "injunctive relief, specific performance, or other equitable remedies",
      },
      {
        id: "5.2",
        text: "The Company's right to seek equitable relief shall be in addition to, and not in lieu of, any other rights or remedies available at law or in equity, including the right to recover monetary damages for any breach of this Agreement.",
        bold: "in addition to, and not in lieu of",
      },
      {
        id: "5.3",
        text: "In the event of any legal action arising out of or related to a breach of this Agreement, the prevailing party shall be entitled to recover its reasonable attorney's fees, court costs, and other expenses of litigation from the non-prevailing party.",
        bold: "reasonable attorney's fees, court costs, and other expenses",
      },
    ],
  },
  {
    number: 6,
    title: "Non-Solicitation",
    clauses: [
      {
        id: "6.1",
        text: "For a period of two (2) years following the termination or expiration of the Receiving Party's relationship with the Company, the Receiving Party shall not, directly or indirectly, solicit, contact, or attempt to divert any client, customer, or business partner of the Company for the purpose of providing services that are competitive with or substantially similar to those offered by the Company.",
        bold: "two (2) years",
      },
      {
        id: "6.2",
        text: "The Receiving Party shall not use any Confidential Information, including but not limited to client lists, contact information, or knowledge of client preferences or engagement terms, to solicit or service any Company client or prospective client.",
      },
      {
        id: "6.3",
        text: 'For purposes of this Section, "solicit" includes any direct or indirect communication, whether initiated by the Receiving Party or a third party acting at the Receiving Party\'s direction, that is intended to or has the effect of diverting business away from the Company.',
      },
    ],
  },
  {
    number: 7,
    title: "General Provisions",
    clauses: [
      {
        id: "7.1",
        text: "Entire Agreement. This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, relating to such subject matter.",
        bold: "Entire Agreement.",
      },
      {
        id: "7.2",
        text: "Amendment. This Agreement may not be amended, modified, or supplemented except by a written instrument signed by both parties.",
        bold: "Amendment.",
      },
      {
        id: "7.3",
        text: "Severability. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving the original intent of the parties.",
        bold: "Severability.",
      },
      {
        id: "7.4",
        text: "Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of laws principles. Any legal action or proceeding arising under this Agreement shall be brought exclusively in the state or federal courts located in Miami-Dade County, Florida, and the parties hereby consent to personal jurisdiction and venue therein.",
        bold: "laws of the State of Florida",
      },
      {
        id: "7.5",
        text: "Waiver. The failure of the Company to enforce any provision of this Agreement shall not constitute a waiver of such provision or the right to enforce it at a later time. No waiver of any breach shall be construed as a waiver of any subsequent breach.",
        bold: "Waiver.",
      },
      {
        id: "7.6",
        text: "Assignment. The Receiving Party may not assign or transfer this Agreement or any rights or obligations hereunder without the prior written consent of the Company. The Company may freely assign this Agreement to any successor, affiliate, or assignee.",
        bold: "Assignment.",
      },
      {
        id: "7.7",
        text: "Notices. All notices required or permitted under this Agreement shall be in writing and shall be deemed delivered when sent by email to the address provided by the respective party, or when delivered by hand, courier, or certified mail to the address of the respective party.",
        bold: "Notices.",
      },
      {
        id: "7.8",
        text: "Electronic Signatures. The parties agree that electronic signatures are valid and binding with the same force and effect as original ink signatures. This Agreement may be executed in counterparts, each of which shall be deemed an original.",
        bold: "Electronic Signatures.",
      },
    ],
  },
];

export const NDA_ACKNOWLEDGMENTS = [
  "I understand that event locations and venue information are strictly confidential",
  "I will not disclose Company revenue, pricing, or any financial information",
  "I will not share my compensation or anyone else's compensation with third parties",
  "I understand that breach of this Agreement may result in injunctive relief and monetary damages",
  "This is a binding legal agreement with obligations that survive termination",
];

export const NDA_FOOTER =
  "This document was generated electronically and is valid with electronic signature.";
