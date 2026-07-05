import type {
	AuditFinding,
	AuditReviewStatus,
	FindingCategory,
	FindingSeverity,
	RiskScoreInput,
} from "@drenyra/domain/entities";

export interface JudgeAgentInput {
	companyId: string;
	targetType: string;
	targetId: string;
	debitCents: number;
	creditCents: number;
	currencyCode?: string;
	entryDate?: string;
	periodLocked?: boolean;
	hasEvidence?: boolean;
	evidenceIds?: string[];
	description?: string;
	entryIdsForDedup?: string[];
	relatedEntryDebitCents?: number;
	relatedEntryCreditCents?: number;
	expectedDebitCents?: number;
	expectedCreditCents?: number;
}

export interface JudgeFinding {
	severity: FindingSeverity;
	category: FindingCategory;
	description: string;
	details: Record<string, unknown>;
	ruleId?: string;
	automated: boolean;
}

export interface JudgeAgentOutput {
	status: AuditReviewStatus;
	riskScore: number;
	findings: JudgeFinding[];
	checksRun: number;
	summary: string;
}

function calculateRiskScore(input: RiskScoreInput): number {
	let score = 0;

	const totalCents = input.debitCents + input.creditCents;

	if (totalCents > 10_000_000) score += 25;
	else if (totalCents > 1_000_000) score += 15;
	else if (totalCents > 100_000) score += 5;

	if (input.debitCents !== input.creditCents) score += 30;
	if (!input.hasEvidence) score += 15;
	if (input.periodLocked) score += 10;
	if (input.duplicateEntries > 0) score += 20;
	if (input.amountMismatch) score += 20;

	return Math.min(score, 100);
}

function checkBalance(
	debitCents: number,
	creditCents: number,
): JudgeFinding | null {
	if (debitCents === creditCents) return null;

	const diff = Math.abs(debitCents - creditCents);
	const severity: FindingSeverity =
		diff > 1_000_000 ? "CRITICAL" : diff > 100_000 ? "HIGH" : "MEDIUM";

	return {
		severity,
		category: "AMOUNT_MISMATCH",
		description: `El asiento no está balanceado: debe S/${(debitCents / 100).toFixed(2)} vs haber S/${(creditCents / 100).toFixed(2)}`,
		details: { debitCents, creditCents, difference: debitCents - creditCents },
		automated: true,
	};
}

function checkPartialDuplicate(
	entryIdsForDedup: string[] | undefined,
): JudgeFinding | null {
	if (!entryIdsForDedup?.length || entryIdsForDedup.length < 2) return null;

	return {
		severity: "LOW",
		category: "DUPLICATE",
		description: `Se detectaron ${entryIdsForDedup.length} entradas similares en el mismo período`,
		details: { similarEntryIds: entryIdsForDedup },
		automated: true,
	};
}

function checkPeriodLock(
	periodLocked: boolean | undefined,
): JudgeFinding | null {
	if (!periodLocked) return null;

	return {
		severity: "HIGH",
		category: "TIMING",
		description:
			"El período contable está cerrado; esta entrada modifica un período ya cerrado",
		details: { periodLocked: true },
		automated: true,
	};
}

function checkEvidenceCompleteness(
	hasEvidence: boolean | undefined,
	evidenceIds: string[] | undefined,
): JudgeFinding | null {
	if (hasEvidence && (evidenceIds?.length ?? 0) > 0) return null;
	if (!hasEvidence && (!evidenceIds || evidenceIds.length === 0)) {
		return {
			severity: "MEDIUM",
			category: "MISSING_EVIDENCE",
			description: "No se adjuntó soporte documental a la entrada contable",
			details: { evidenceIds: evidenceIds ?? [] },
			automated: true,
		};
	}
	return null;
}

function checkClassification(
	description: string | undefined,
	debitCents: number,
	creditCents: number,
): JudgeFinding | null {
	if (!description) return null;

	const keywords: Array<{ word: string; category: FindingCategory }> = [
		{ word: "IGV", category: "COMPLIANCE" },
		{ word: "detracción", category: "COMPLIANCE" },
		{ word: "retención", category: "COMPLIANCE" },
		{ word: "planilla", category: "COMPLIANCE" },
		{ word: "remuneración", category: "COMPLIANCE" },
	];

	const descLower = description.toLowerCase();
	const matched = keywords.filter((k) =>
		descLower.includes(k.word.toLowerCase()),
	);

	if (matched.length > 0 && (debitCents === 0 || creditCents === 0)) {
		return {
			severity: "HIGH",
			category: "CLASSIFICATION",
			description: `La entrada menciona términos fiscales (${matched.map((m) => m.word).join(", ")}) pero tiene valores en cero en debe o haber`,
			details: {
				matchedKeywords: matched.map((m) => m.word),
				debitCents,
				creditCents,
			},
			automated: true,
		};
	}

	return null;
}

export function runJudgeAgent(input: JudgeAgentInput): JudgeAgentOutput {
	const findings: JudgeFinding[] = [];

	const balanceFinding = checkBalance(input.debitCents, input.creditCents);
	if (balanceFinding) findings.push(balanceFinding);

	const duplicateFinding = checkPartialDuplicate(input.entryIdsForDedup);
	if (duplicateFinding) findings.push(duplicateFinding);

	const periodFinding = checkPeriodLock(input.periodLocked);
	if (periodFinding) findings.push(periodFinding);

	const evidenceFinding = checkEvidenceCompleteness(
		input.hasEvidence,
		input.evidenceIds,
	);
	if (evidenceFinding) findings.push(evidenceFinding);

	const classificationFinding = checkClassification(
		input.description,
		input.debitCents,
		input.creditCents,
	);
	if (classificationFinding) findings.push(classificationFinding);

	const riskScore = calculateRiskScore({
		debitCents: input.debitCents,
		creditCents: input.creditCents,
		hasEvidence: input.hasEvidence ?? false,
		periodLocked: input.periodLocked ?? false,
		duplicateEntries: input.entryIdsForDedup?.length ?? 0,
		amountMismatch: balanceFinding !== null,
	});

	const hasCritical = findings.some((f) => f.severity === "CRITICAL");
	const hasHigh = findings.some((f) => f.severity === "HIGH");
	const hasAny = findings.length > 0;

	let status: AuditReviewStatus;
	if (riskScore >= 70 || hasCritical) {
		status = "FAILED";
	} else if (riskScore >= 30 || hasHigh) {
		status = "NEEDS_REVIEW";
	} else if (hasAny) {
		status = "PASSED";
	} else {
		status = "PASSED";
	}

	return {
		status,
		riskScore,
		findings,
		checksRun: 5,
		summary: `Revisión completada: ${findings.length} hallazgo(s), score de riesgo ${riskScore}/100, estado: ${status}`,
	};
}
