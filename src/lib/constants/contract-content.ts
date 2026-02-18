/**
 * Purchase Agreement content — mirrors the SimsForHire Purchase Agreement PDF.
 * Rendered as a beautiful UI on the contract page. Admin-editable sections
 * are stored here as structured data so the UI can render them with proper
 * formatting, numbering, and emphasis.
 */

export interface ContractSubItem {
  id: string;
  text: string;
  bold?: string; // portion to render bold
}

export interface ContractSection {
  number: number;
  title: string;
  clauses: {
    id: string;
    text: string;
    bold?: string; // portion to render bold
    subItems?: ContractSubItem[];
  }[];
}

export const CONTRACT_HEADER = {
  company: "SIMSFORHIRE",
  division: "A Division of LevelSim LLC Holdings",
  title: "PURCHASE AGREEMENT",
  allSalesFinal: "ALL SALES ARE FINAL",
  allSalesSubtext: "NO REFUNDS • NO EXCHANGES • NO EXCEPTIONS",
  preamble:
    'This Purchase Agreement ("Agreement") is between SimsForHire, a trade name of LevelSim LLC Holdings, a Wyoming LLC ("Seller"), and the Buyer identified above ("Buyer"). By completing this purchase and signing below, Buyer agrees to all terms in this Agreement.',
};

export const CONTRACT_SECTIONS: ContractSection[] = [
  {
    number: 1,
    title: "All Sales Final",
    clauses: [
      {
        id: "1.1",
        text: "All sales are final. No refunds or exchanges will be issued for any reason, including change of mind, buyer's remorse, incompatibility, dissatisfaction with features, or failure to review specifications before purchase.",
      },
      {
        id: "1.2",
        text: "By signing this Agreement, Buyer confirms they have been clearly informed—both verbally and in writing—that all sales are final. Buyer waives any right to dispute this policy after signing.",
      },
    ],
  },
  {
    number: 2,
    title: "Chargeback & Payment Dispute Waiver",
    clauses: [
      {
        id: "2.1",
        text: "Buyer agrees not to initiate any chargeback, payment dispute, or reversal of charges with their bank, credit card company, or any payment processor (including Stripe, PayPal, Square, Affirm, Klarna, or any buy-now-pay-later service).",
        bold: "not to initiate any chargeback, payment dispute, or reversal of charges",
      },
      {
        id: "2.2",
        text: "If Buyer initiates a chargeback or payment dispute, this constitutes a breach of this Agreement and Seller reserves the right to:",
        bold: "breach of this Agreement",
        subItems: [
          {
            id: "a",
            text: "Submit this signed Agreement as evidence to the payment processor to contest the dispute;",
          },
          {
            id: "b",
            text: "Recover the full disputed amount plus all chargeback fees, administrative costs, and collection costs;",
          },
          {
            id: "c",
            text: "Pursue legal remedies including civil action for breach of contract, fraud, and/or unjust enrichment;",
          },
          {
            id: "d",
            text: "Report fraudulent chargebacks to applicable fraud databases to the extent permitted by law;",
          },
          {
            id: "e",
            text: "Charge a $150.00 chargeback administration fee per occurrence in addition to other damages.",
            bold: "$150.00 chargeback administration fee",
          },
        ],
      },
      {
        id: "2.3",
        text: "Buyer agrees to contact SimsForHire directly to resolve any dispute before taking any other action. Failure to do so shall be considered evidence of bad faith.",
        bold: "before",
      },
    ],
  },
  {
    number: 3,
    title: "Warranty",
    clauses: [
      {
        id: "3.1",
        text: "All products include the original manufacturer's warranty. Warranty terms, duration, and coverage vary by manufacturer. SimsForHire is an authorized reseller, not the warrantor.",
        bold: "original manufacturer's warranty",
      },
      {
        id: "3.2",
        text: "SimsForHire makes no additional warranties, express or implied, including warranties of merchantability or fitness for a particular purpose. A manufacturer warranty does not create any right to a refund or exchange from SimsForHire.",
      },
    ],
  },
  {
    number: 4,
    title: "White Glove Delivery & Support",
    clauses: [
      {
        id: "4.1",
        text: "Buyers who purchase White Glove Delivery receive professional delivery, assembly, and setup, plus post-purchase support:",
        bold: "White Glove Delivery",
        subItems: [
          {
            id: "a",
            text: "Bring it in (free): Bring the product to our store for diagnosis and troubleshooting at no charge. If covered under manufacturer warranty, we'll help initiate the claim.",
            bold: "Bring it in (free):",
          },
          {
            id: "b",
            text: "We come to you (service fee): For larger items, we'll send a technician to your location. A service fee applies and will be quoted in advance. If no defect is found, the service fee still applies.",
            bold: "We come to you (service fee):",
          },
        ],
      },
      {
        id: "4.2",
        text: "Non-White Glove buyers handle all warranty claims directly with the manufacturer. SimsForHire is not responsible for damage from misuse, neglect, unauthorized modification, power surges, water damage, or accidents.",
      },
    ],
  },
  {
    number: 5,
    title: "Payment",
    clauses: [
      {
        id: "5.1",
        text: "Full payment is due at time of purchase. No product ships until payment clears. Returned payments incur a $50.00 fee.",
        bold: "$50.00 fee",
      },
      {
        id: "5.2",
        text: "If using third-party financing, Buyer is bound by both this Agreement and the financing terms. Financing issues do not affect the finality of the sale.",
      },
    ],
  },
  {
    number: 6,
    title: "Delivery & Risk of Loss",
    clauses: [
      {
        id: "6.1",
        text: "Delivery dates are estimates, not guarantees. Delays from carriers, supply chain, or weather do not constitute grounds for cancellation or chargeback.",
      },
      {
        id: "6.2",
        text: "Standard shipping: Risk transfers to Buyer at carrier pickup. Transit claims go to the carrier. White Glove: Risk transfers upon delivery completion and Buyer sign-off.",
        bold: "White Glove:",
      },
      {
        id: "6.3",
        text: "Buyer must inspect products upon delivery and report visible damage within 24 hours. Failure to do so constitutes acceptance.",
        bold: "24 hours",
      },
    ],
  },
  {
    number: 7,
    title: "Limitation of Liability",
    clauses: [
      {
        id: "7.1",
        text: "SimsForHire's total liability shall not exceed the purchase price of the specific product(s) at issue. SimsForHire is not liable for indirect, incidental, special, consequential, or punitive damages.",
      },
    ],
  },
  {
    number: 8,
    title: "Disputes & Governing Law",
    clauses: [
      {
        id: "8.1",
        text: "This Agreement is governed by Wyoming law. Any legal action shall be brought in Wyoming state or federal courts. The prevailing party recovers reasonable attorney's fees and costs.",
      },
      {
        id: "8.2",
        text: "Before legal action, both parties agree to attempt good faith mediation with costs shared equally.",
      },
    ],
  },
  {
    number: 9,
    title: "General",
    clauses: [
      {
        id: "9.1",
        text: "This is the entire agreement and supersedes all prior discussions. It may only be amended in writing signed by both parties. If any provision is unenforceable, the rest remains in effect. Electronic signatures are valid and binding.",
      },
    ],
  },
];

export const BUYER_ACKNOWLEDGMENTS = [
  "All sales are final • No refunds or exchanges for any reason",
  "No chargebacks or payment disputes will be initiated",
  "Products carry manufacturer warranty only",
  "This is a binding legal agreement",
];

export const CONTRACT_FOOTER =
  "This document was generated electronically and is valid with electronic signature.";
