/**
 * ARKELYTHEX Artifact Contract
 * Estandar audit-first para Canvas + Stream.
 */

export const ARTIFACT_TYPES = {
	SIRE_DIFF: "sire.diff.v1",
	PAYMENT_PREVIEW: "payment.preview.v1",
	FISCAL_ADVISORY: "fiscal.advisory.v1",
	LEDGER_ADJUSTMENT: "ledger.adjustment.v1",
	BANKING_RECONCILIATION: "banking.reconciliation.v1",
} as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[keyof typeof ARTIFACT_TYPES];
export type ArtifactStatus = "PREVIEW" | "COMMITTED" | "ROLLED_BACK" | "ERROR";
export type ArtifactSource = "SUNAT" | "INTERNAL" | "BANK" | "AI_DERIVED";

import type { Currency as CurrencyCode } from "@drenyra/domain";
export type ArtifactRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ArtifactPolicyGate {
	policyKey: string;
	requiresReason: boolean;
	requiresDualApproval: boolean;
}

export interface ArtifactAction {
	id: string;
	label: string;
	type: "PRIMARY" | "SECONDARY" | "DANGER";
	icon?: string;
	requiresConfirmation?: boolean;
	riskLevel?: ArtifactRiskLevel;
	policyGate?: ArtifactPolicyGate;
}

export interface ArtifactMetadata {
	traceId: string;
	correlationId: string;
	source: ArtifactSource;
	createdAt: string;
	actor: string;
	policyResult?: {
		allowed: boolean;
		reason?: string;
	};
}

export interface PolicyApprovalProof {
	controlId: string;
	approvedAt: string;
	requester: string;
	approver?: string;
	reason: string;
}

export interface ArtifactFieldPatch {
	op: "replace";
	path: string;
	before: string | number | null;
	after: string | number | null;
	rationale: string;
	confidence: number;
	riskLevel: ArtifactRiskLevel;
}

export interface Artifact<
	TData = unknown,
	TType extends string = ArtifactType,
> {
	id: string;
	type: TType;
	version: string;
	status: ArtifactStatus;
	metadata: ArtifactMetadata;
	title: string;
	description?: string;
	data: TData;
	actions: ArtifactAction[];
}

// --- SIRE TYPES ---

export type SireDiffStatus =
	| "MATCH"
	| "MISMATCH"
	| "MISSING_LOCAL"
	| "MISSING_SUNAT";

export interface SireDocumentRecord {
	documentType: string;
	series: string;
	number: string;
	issueDate: string;
	total: number;
	currency: CurrencyCode;
	ruc?: string;
	reasonSocial?: string;
}

export interface SireDiffRow {
	id: string;
	status: SireDiffStatus;
	reason: string;
	difference: number;
	localRecord?: SireDocumentRecord;
	sunatRecord?: SireDocumentRecord;
	cpeRecord?: SireDocumentRecord;
	resolution?: "ACCEPTED_SUNAT" | "KEPT_LOCAL" | "PENDING";
}

export interface SireDiffSummary {
	matched: number;
	mismatched: number;
	missingOnLedger: number;
	missingOnSunat: number;
	critical: number;
	totalDifference: number;
}

export interface SireDiffArtifactData {
	period: string;
	currency: CurrencyCode;
	summary: SireDiffSummary;
	rows: SireDiffRow[];
	sunatSource?: "upload" | "unavailable";
	sunatMessage?: string;
	submitBlocked?: boolean;
	submitBlockReason?: string;
}

export type SireDiffArtifact = Artifact<
	SireDiffArtifactData,
	typeof ARTIFACT_TYPES.SIRE_DIFF
>;

// Backward aliases to minimize migration churn.
export type SireRow = SireDiffRow;
export type SireDiffData = SireDiffArtifactData;
export type SireRowStatus = SireDiffStatus;

// --- PAYMENT PREVIEW TYPES ---

export interface PaymentBeneficiary {
	id: string;
	name: string;
	bankAccount: string;
	amount: number;
}

export interface PaymentPreviewData {
	provider: string;
	bankAccount: string;
	currency: CurrencyCode;
	totalAmount: number;
	beneficiaries: PaymentBeneficiary[];
}

export type PaymentPreviewArtifact = Artifact<
	PaymentPreviewData,
	typeof ARTIFACT_TYPES.PAYMENT_PREVIEW
>;

export interface ArtifactInteractionEvent {
	id: string;
	artifactId: string;
	artifactType: string;
	traceId: string;
	actionId: string;
	message: string;
	nextStatus?: ArtifactStatus;
	createdAt: string;
	payload?: Record<string, unknown>;
}

// --- BANKING RECONCILIATION TYPES ---

export interface BankingReconciliationRow {
	id: string;
	bankRef: string;
	description: string;
	bankAmount: number;
	ledgerAmount: number;
	difference: number;
	status:
		| "MATCH"
		| "MISMATCH"
		| "MISSING_IN_LEDGER"
		| "MISSING_IN_BANK";
	date: string;
}

export interface BankingReconciliationSummary {
	totalBank: number;
	totalLedger: number;
	totalDifference: number;
	matched: number;
	mismatched: number;
}

export interface BankingReconciliationData {
	period: string;
	accountId: string;
	accountName: string;
	currency: CurrencyCode;
	rows: BankingReconciliationRow[];
	summary: BankingReconciliationSummary;
}

export type BankingReconciliationArtifact = Artifact<
	BankingReconciliationData,
	typeof ARTIFACT_TYPES.BANKING_RECONCILIATION
>;

export type KnownArtifact =
	| SireDiffArtifact
	| PaymentPreviewArtifact
	| BankingReconciliationArtifact;
export type WorkspaceArtifact = KnownArtifact | Artifact;

export function isSireDiffArtifact(
	artifact: WorkspaceArtifact,
): artifact is SireDiffArtifact {
	return artifact.type === ARTIFACT_TYPES.SIRE_DIFF;
}

export function isPaymentPreviewArtifact(
	artifact: WorkspaceArtifact,
): artifact is PaymentPreviewArtifact {
	return artifact.type === ARTIFACT_TYPES.PAYMENT_PREVIEW;
}
