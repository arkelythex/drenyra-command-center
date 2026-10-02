import type {
	AuditEvent,
	AuditReport,
} from "../agents/compliance/audit-logger.agent";
import type { PrivacyReport } from "../agents/compliance/privacy-assessor.agent";
import type {
	Regulation,
	RegulationReport,
} from "../agents/compliance/regulation-tracker.agent";

export type FiscalMemoryCandidateCategory =
	| "audit_event"
	| "privacy_assessment"
	| "regulation_check";

export type FiscalMemoryCandidateSeverity =
	| "low"
	| "medium"
	| "high"
	| "critical";

export interface FiscalMemoryCandidate {
	id: string;
	category: FiscalMemoryCandidateCategory;
	summary: string;
	severity: FiscalMemoryCandidateSeverity;
	timestamp: string;
	data: Record<string, unknown>;
}

export interface AuditMemoryCandidateInput {
	report: AuditReport;
	traceId?: string;
}

export interface PrivacyMemoryCandidateInput {
	report: PrivacyReport;
	traceId?: string;
}

export interface RegulationMemoryCandidateInput {
	report: RegulationReport;
	traceId?: string;
}

export function createFiscalMemoryCandidate(input: {
	category: FiscalMemoryCandidateCategory;
	summary: string;
	severity: FiscalMemoryCandidateSeverity;
	data?: Record<string, unknown>;
}): FiscalMemoryCandidate {
	return {
		id: `fiscal-mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		category: input.category,
		summary: input.summary,
		severity: input.severity,
		timestamp: new Date().toISOString(),
		data: input.data ?? {},
	};
}

export function createAuditLoggerMemoryCandidates(
	input: AuditMemoryCandidateInput,
): FiscalMemoryCandidate[] {
	const candidates: FiscalMemoryCandidate[] = [];

	for (const event of input.report.events as readonly AuditEvent[]) {
		candidates.push(
			createFiscalMemoryCandidate({
				category: "audit_event",
				summary: `Audit: ${event.actor} performed ${event.action}`,
				severity: "low",
				data: {
					eventId: event.id,
					actor: event.actor,
					action: event.action,
					traceId: input.traceId,
				},
			}),
		);
	}

	for (const finding of input.report.findings) {
		candidates.push(
			createFiscalMemoryCandidate({
				category: "audit_event",
				summary: `Audit finding [${finding.severity}]: ${finding.message}`,
				severity:
					finding.severity === "critical"
						? "critical"
						: finding.severity === "high"
							? "high"
							: "medium",
				data: { findingId: finding.id, finding, traceId: input.traceId },
			}),
		);
	}

	return candidates;
}

export function createPrivacyMemoryCandidates(
	input: PrivacyMemoryCandidateInput,
): FiscalMemoryCandidate[] {
	const candidates: FiscalMemoryCandidate[] = [];

	if (input.report.privacyRiskScore > 0) {
		candidates.push(
			createFiscalMemoryCandidate({
				category: "privacy_assessment",
				summary: `Privacy risk score: ${input.report.privacyRiskScore}/100`,
				severity: input.report.privacyRiskScore >= 85 ? "high" : "medium",
				data: {
					riskScore: input.report.privacyRiskScore,
					traceId: input.traceId,
				},
			}),
		);
	}

	for (const finding of input.report.findings) {
		candidates.push(
			createFiscalMemoryCandidate({
				category: "privacy_assessment",
				summary: `Privacy: ${finding.message}`,
				severity:
					finding.severity === "critical"
						? "critical"
						: finding.severity === "high"
							? "high"
							: "medium",
				data: { findingId: finding.id, finding, traceId: input.traceId },
			}),
		);
	}

	return candidates;
}

export function createRegulationMemoryCandidates(
	input: RegulationMemoryCandidateInput,
): FiscalMemoryCandidate[] {
	const candidates: FiscalMemoryCandidate[] = [];

	for (const reg of input.report.regulations as readonly Regulation[]) {
		candidates.push(
			createFiscalMemoryCandidate({
				category: "regulation_check",
				summary: `Regulation ${reg.id}: ${reg.status}`,
				severity: reg.status === "active" ? "low" : "medium",
				data: {
					regulationId: reg.id,
					status: reg.status,
					jurisdiction: reg.jurisdiction,
					traceId: input.traceId,
				},
			}),
		);
	}

	for (const finding of input.report.findings) {
		candidates.push(
			createFiscalMemoryCandidate({
				category: "regulation_check",
				summary: `Regulation finding: ${finding.message}`,
				severity:
					finding.severity === "critical"
						? "critical"
						: finding.severity === "high"
							? "high"
							: "medium",
				data: { findingId: finding.id, finding, traceId: input.traceId },
			}),
		);
	}

	return candidates;
}
