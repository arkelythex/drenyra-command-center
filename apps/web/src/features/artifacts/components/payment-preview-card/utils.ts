import { n } from "@/lib/utils";
import type {
  ArtifactFieldPatch,
  ArtifactInteractionEvent,
  ArtifactRiskLevel,
  CurrencyCode,
  PaymentBeneficiary,
  PaymentPreviewArtifact,
} from '../../types/artifact.types';
import type { InlineEditRiskAssessment } from './types';

const HIGH_AMOUNT_THRESHOLD = 5000;
const CRITICAL_AMOUNT_THRESHOLD = 10000;
const HIGH_DELTA_THRESHOLD = 1500;
const CRITICAL_DELTA_THRESHOLD = 3000;

export function emitPaymentEvent(
  artifact: PaymentPreviewArtifact,
  actionId: string,
  message: string,
  nextStatus?: ArtifactInteractionEvent['nextStatus'],
): ArtifactInteractionEvent {
  return {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    artifactId: artifact.id,
    artifactType: artifact.type,
    traceId: artifact.metadata.traceId,
    actionId,
    message,
    nextStatus,
    createdAt: new Date().toISOString(),
  };
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return n(amount, currency);
}

export function buildPaymentTableRows(
  beneficiaries: PaymentBeneficiary[],
  currency: CurrencyCode,
  provider: string,
): string[][] {
  return beneficiaries.map((beneficiary) => [
    beneficiary.name,
    beneficiary.bankAccount,
    beneficiary.amount.toFixed(2),
    currency,
    provider,
  ]);
}

export function parseInlineAmount(prompt: string): number | null {
  const normalized = prompt.trim().replace(',', '.');
  if (!normalized) return null;

  const directNumeric = Number(normalized);
  if (Number.isFinite(directNumeric) && directNumeric > 0) {
    return Number(directNumeric.toFixed(2));
  }

  const match = normalized.match(/\b\d+(?:\.\d{1,2})?\b/);
  if (!match) return null;

  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
}

export function assessInlineEditRisk(before: number, after: number): InlineEditRiskAssessment {
  const delta = Math.abs(after - before);

  if (after >= CRITICAL_AMOUNT_THRESHOLD || delta >= CRITICAL_DELTA_THRESHOLD) {
    return { riskLevel: 'CRITICAL', requiresPolicyGate: true };
  }

  if (after >= HIGH_AMOUNT_THRESHOLD || delta >= HIGH_DELTA_THRESHOLD) {
    return { riskLevel: 'HIGH', requiresPolicyGate: true };
  }

  return {
    riskLevel: delta > 0 ? 'MEDIUM' : 'LOW',
    requiresPolicyGate: false,
  };
}

export function buildBeneficiaryAmountPatch(
  beneficiary: PaymentBeneficiary,
  nextAmount: number,
): ArtifactFieldPatch {
  const risk = assessInlineEditRisk(beneficiary.amount, nextAmount);
  return {
    op: 'replace',
    path: `/data/beneficiaries/${beneficiary.id}/amount`,
    before: beneficiary.amount,
    after: nextAmount,
    rationale: `Ajuste inline para ${beneficiary.name}`,
    confidence: 0.94,
    riskLevel: risk.riskLevel as ArtifactRiskLevel,
  };
}

export function computeTotalAmount(beneficiaries: PaymentBeneficiary[]): number {
  return Number(beneficiaries.reduce((sum, beneficiary) => sum + beneficiary.amount, 0).toFixed(2));
}

export function getNextSelectionId(
  beneficiaries: PaymentBeneficiary[],
  selectedId: string | null,
  direction: 'up' | 'down',
): string | null {
  if (beneficiaries.length === 0) return null;

  const currentId = selectedId ?? beneficiaries[0].id;
  const index = beneficiaries.findIndex((beneficiary) => beneficiary.id === currentId);
  const safeIndex = index === -1 ? 0 : index;
  const delta = direction === 'down' ? 1 : -1;
  const nextIndex = (safeIndex + delta + beneficiaries.length) % beneficiaries.length;

  return beneficiaries[nextIndex].id;
}

export function ensureSelectedBeneficiary(
  beneficiaries: PaymentBeneficiary[],
  selectedId: string | null,
): string | null {
  if (beneficiaries.length === 0) return null;
  if (!selectedId) return beneficiaries[0].id;

  const exists = beneficiaries.some((beneficiary) => beneficiary.id === selectedId);
  return exists ? selectedId : beneficiaries[0].id;
}

export function buildPaymentInlineSuggestions(beneficiary: PaymentBeneficiary): string[] {
  const current = beneficiary.amount;
  const higher = Number((current * 1.1).toFixed(2));
  const lower = Number(Math.max(1, current * 0.9).toFixed(2));

  return [
    `ajusta a ${current.toFixed(2)}`,
    `ajusta a ${higher.toFixed(2)}`,
    `ajusta a ${lower.toFixed(2)}`,
  ];
}
