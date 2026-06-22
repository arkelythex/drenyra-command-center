import type { ArtifactFieldPatch, ArtifactRiskLevel, PaymentBeneficiary } from '../../types/artifact.types';

export interface PaymentBeneficiaryDraft {
  beneficiaryId: string;
  nextAmount: number;
  note: string;
  patch: ArtifactFieldPatch;
}

export type PaymentSelectionDirection = 'up' | 'down';

export interface PaymentBeneficiaryView extends PaymentBeneficiary {
  draft?: PaymentBeneficiaryDraft;
}

export interface InlineEditRiskAssessment {
  riskLevel: ArtifactRiskLevel;
  requiresPolicyGate: boolean;
}
