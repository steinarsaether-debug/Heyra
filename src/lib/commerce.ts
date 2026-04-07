import {
  BookingFlowType,
  BookingStatus,
  CancellationPolicy,
  ContractStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";

export const LEGAL_TERMS_VERSION = "2026-04";
export const STANDARD_VAT_RATE = 0.25;

export function formatCancellationPolicy(policy: CancellationPolicy) {
  return policy.charAt(0) + policy.slice(1).toLowerCase();
}

export function formatPaymentProvider(provider: PaymentProvider) {
  return provider
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPaymentStatus(status: PaymentStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatContractStatus(status: ContractStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPaymentProviderOptions(flowType: BookingFlowType) {
  return flowType === BookingFlowType.INSTANT_FISHING
    ? [PaymentProvider.VIPPS_SIMULATED, PaymentProvider.STRIPE_SIMULATED]
    : [PaymentProvider.STRIPE_SIMULATED, PaymentProvider.VIPPS_SIMULATED];
}

export function isPaymentSettled(status: PaymentStatus) {
  return new Set<PaymentStatus>([
    PaymentStatus.CAPTURED,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ]).has(status);
}

export function getDaysUntil(date: Date, now = new Date()) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const target = new Date(date.toDateString());
  const current = new Date(now.toDateString());
  return Math.ceil((target.getTime() - current.getTime()) / msPerDay);
}

export function calculateRefundAmount(
  policy: CancellationPolicy,
  totalNok: number,
  startDate: Date,
  now = new Date(),
) {
  const daysUntilStart = getDaysUntil(startDate, now);

  if (policy === CancellationPolicy.FLEXIBLE) {
    if (daysUntilStart >= 14) return totalNok;
    if (daysUntilStart >= 7) return Math.round(totalNok * 0.75);
    return Math.round(totalNok * 0.5);
  }

  if (policy === CancellationPolicy.STRICT) {
    if (daysUntilStart >= 30) return Math.round(totalNok * 0.75);
    if (daysUntilStart >= 14) return Math.round(totalNok * 0.4);
    return 0;
  }

  if (daysUntilStart >= 21) return totalNok;
  if (daysUntilStart >= 8) return Math.round(totalNok * 0.5);
  return Math.round(totalNok * 0.25);
}

export function buildContractDocumentNumber(bookingId: string) {
  return `JT-${bookingId.slice(-8).toUpperCase()}`;
}

export function buildInvoiceNumber(bookingId: string) {
  return `INV-${bookingId.slice(-8).toUpperCase()}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("nb-NO");
}

function formatNok(amount: number) {
  return amount.toLocaleString("nb-NO", { style: "currency", currency: "NOK" });
}

export function buildContractHtml(input: {
  documentNumber: string;
  listingTitle: string;
  flowType: BookingFlowType;
  hunterName: string;
  hunterEmail: string;
  landownerName: string;
  landownerEmail: string;
  cadastralRef: string;
  municipality: string;
  county: string;
  startDate: Date;
  endDate: Date;
  totalNok: number;
  cancellationPolicy: CancellationPolicy;
  requestMessage: string | null;
  governanceNotes: string | null;
}) {
  return `<!doctype html>
<html lang="nb">
  <head>
    <meta charset="utf-8" />
    <title>Jaktavtale ${input.documentNumber}</title>
    <style>
      body { font-family: Georgia, serif; margin: 40px; color: #1c241f; line-height: 1.6; }
      h1, h2 { color: #244233; }
      .box { border: 1px solid #d7d1c5; border-radius: 16px; padding: 16px; margin: 16px 0; }
      .muted { color: #5d665f; }
    </style>
  </head>
  <body>
    <h1>${input.flowType === BookingFlowType.INSTANT_FISHING ? "Fiskeavtale" : "Jaktavtale"}</h1>
    <p class="muted">Dokumentnummer ${input.documentNumber} · Vilkårsversjon ${LEGAL_TERMS_VERSION}</p>
    <div class="box">
      <h2>Parter</h2>
      <p><strong>Utleier:</strong> ${input.landownerName} (${input.landownerEmail})</p>
      <p><strong>Jeger/Fisker:</strong> ${input.hunterName} (${input.hunterEmail})</p>
    </div>
    <div class="box">
      <h2>Område og periode</h2>
      <p><strong>Tilbud:</strong> ${input.listingTitle}</p>
      <p><strong>Eiendom:</strong> ${input.cadastralRef}, ${input.municipality}, ${input.county}</p>
      <p><strong>Gyldighet:</strong> ${formatDate(input.startDate)} til ${formatDate(input.endDate)}</p>
    </div>
    <div class="box">
      <h2>Pris og avbestilling</h2>
      <p><strong>Totalpris:</strong> ${formatNok(input.totalNok)}</p>
      <p><strong>Avbestillingspolicy:</strong> ${formatCancellationPolicy(input.cancellationPolicy)}</p>
    </div>
    ${
      input.requestMessage
        ? `<div class="box"><h2>Bestillingsmelding</h2><p>${input.requestMessage}</p></div>`
        : ""
    }
    ${
      input.governanceNotes
        ? `<div class="box"><h2>Tilleggsforutsetninger</h2><p>${input.governanceNotes}</p></div>`
        : ""
    }
    <div class="box">
      <h2>Signering</h2>
      <p>Avtalen er gyldig når begge parter har signert og betaling er bekreftet.</p>
    </div>
  </body>
</html>`;
}

export function buildInvoiceHtml(input: {
  invoiceNumber: string;
  listingTitle: string;
  hunterName: string;
  hunterEmail: string;
  issuedAt: Date;
  subtotalNok: number;
  vatNok: number;
  totalNok: number;
}) {
  return `<!doctype html>
<html lang="nb">
  <head>
    <meta charset="utf-8" />
    <title>Faktura ${input.invoiceNumber}</title>
    <style>
      body { font-family: Georgia, serif; margin: 40px; color: #1c241f; line-height: 1.6; }
      h1 { color: #244233; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      td, th { border-bottom: 1px solid #d7d1c5; padding: 12px 8px; text-align: left; }
    </style>
  </head>
  <body>
    <h1>Faktura ${input.invoiceNumber}</h1>
    <p>Utstedt ${formatDate(input.issuedAt)} til ${input.hunterName} (${input.hunterEmail})</p>
    <table>
      <thead><tr><th>Beskrivelse</th><th>Beløp</th></tr></thead>
      <tbody>
        <tr><td>${input.listingTitle}</td><td>${formatNok(input.subtotalNok)}</td></tr>
        <tr><td>MVA (25%)</td><td>${formatNok(input.vatNok)}</td></tr>
        <tr><td><strong>Total</strong></td><td><strong>${formatNok(input.totalNok)}</strong></td></tr>
      </tbody>
    </table>
  </body>
</html>`;
}

export function isContractFullySigned(input: {
  hunterSignedAt: Date | null;
  landownerSignedAt: Date | null;
}) {
  return Boolean(input.hunterSignedAt && input.landownerSignedAt);
}

export function shouldCaptureAuthorizedPayment(startDate: Date, now = new Date()) {
  return new Date(startDate.toDateString()) <= new Date(now.toDateString());
}

export function getBookingActionAvailability(input: {
  status: BookingStatus;
  hasSignedContract: boolean;
  hasAuthorizedPayment: boolean;
}) {
  if (input.status === BookingStatus.SHARED_CONFIRMATION_PENDING) {
    return "Shared confirmation still needs to happen before contracts and payment can begin.";
  }

  if (input.status === BookingStatus.APPROVED && !input.hasSignedContract) {
    return "Complete contract signing before the trip can be confirmed.";
  }

  if (input.status === BookingStatus.CONTRACT_PENDING && !input.hasAuthorizedPayment) {
    return "Authorize payment after both sides have signed.";
  }

  return null;
}
