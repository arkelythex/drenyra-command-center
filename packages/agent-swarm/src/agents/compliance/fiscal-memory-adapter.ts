export type FiscalMemoryCandidateCategory =
	| "accounting_criterion"
	| "tax_decision"
	| "audit_finding"
	| "monthly_closing"
	| "evidence_note"
	| "risk_exception"
	| "client_explanation"
	| "recurring_error";

export type FiscalMemoryCandidateSeverity =
	| "info"
	| "low"
	| "medium"
	| "high"
	| "critical";

export interface FiscalMemoryCandidate {
	readonly category: FiscalMemoryCandidateCategory;
	readonly severity: FiscalMemoryCandidateSeverity;
	readonly title: string;
	readonly summary: string;
	readonly evidenceRefs: readonly string[];
	readonly tags: readonly string[];
	readonly sourceAgentId: string;
	readonly requiresApproval: boolean;
}

export interface AuditMemoryCandidateInput {
	readonly coverage: number;
	readonly tamperProof: boolean;
	readonly gaps: readonly string[];
}

export interface PrivacyMemoryCandidateInput {
	readonly score: number;
	readonly highRiskDescriptions: readonly string[];
}

export interface RegulationMemoryCandidateInput {
	readonly highImpactAlerts: readonly string[];
}

const requiresApproval = (category: FiscalMemoryCandidateCategory): boolean =>
	category === "tax_decision" ||
	category === "audit_finding" ||
	category === "risk_exception" ||
	category === "monthly_closing";

export const createFiscalMemoryCandidate = (input: {
	readonly category: FiscalMemoryCandidateCategory;
	readonly severity: FiscalMemoryCandidateSeverity;
	readonly title: string;
	readonly summary: string;
	readonly evidenceRefs?: readonly string[];
	readonly tags?: readonly string[];
	readonly sourceAgentId: string;
}): FiscalMemoryCandidate => ({
	category: input.category,
	severity: input.severity,
	title: input.title,
	summary: input.summary,
	evidenceRefs: input.evidenceRefs ?? [],
	tags: input.tags ?? [],
	sourceAgentId: input.sourceAgentId,
	requiresApproval: requiresApproval(input.category),
});

export const createAuditLoggerMemoryCandidates = (
	input: AuditMemoryCandidateInput,
): FiscalMemoryCandidate[] => {
	if (input.tamperProof && input.gaps.length === 0 && input.coverage >= 90) {
		return [];
	}

	return [
		createFiscalMemoryCandidate({
			category: "audit_finding",
			severity: input.coverage < 80 || !input.tamperProof ? "high" : "medium",
			title: "Audit logging gap detected",
			summary: `Audit coverage ${input.coverage}% with ${input.gaps.length} gap(s).`,
			tags: ["audit", "audit-logger"],
			sourceAgentId: "audit-logger-agent",
		}),
	];
};

export const createPrivacyMemoryCandidates = (
	input: PrivacyMemoryCandidateInput,
): FiscalMemoryCandidate[] => {
	if (input.highRiskDescriptions.length === 0) {
		return [];
	}

	return [
		createFiscalMemoryCandidate({
			category: "risk_exception",
			severity: input.score < 60 ? "critical" : "high",
			title: "Privacy risk requires fiscal compliance review",
			summary: input.highRiskDescriptions.join("; "),
			tags: ["privacy", "risk-exception"],
			sourceAgentId: "privacy-assessor-agent",
		}),
	];
};

export const createRegulationMemoryCandidates = (
	input: RegulationMemoryCandidateInput,
): FiscalMemoryCandidate[] =>
	input.highImpactAlerts.map((alert) =>
		createFiscalMemoryCandidate({
			category: "audit_finding",
			severity: "high",
			title: "High-impact regulation requires review",
			summary: alert,
			tags: ["regulation", "compliance"],
			sourceAgentId: "regulation-tracker-agent",
		}),
	);
