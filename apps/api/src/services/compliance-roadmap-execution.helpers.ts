import type {
	ComplianceRoadmapActionId,
	ComplianceRoadmapDecision,
} from "../types/compliance.types";

export const ROADMAP_ACTION_JOB_MAP: Record<ComplianceRoadmapActionId, string> = {
	"prepare-sire": "prepare-sire",
	"collect-overdue-invoices": "accounts-receivable-review",
	"stabilize-cashflow": "accounts-payable-review",
	"resolve-ledger-repro-mismatch": "monthly-igv-close",
};

export function readTraceId(payload: Record<string, unknown> | null): string | null {
	const value = payload?.traceId;
	return typeof value === "string" && value.length > 0 ? value : null;
}

export function readActionId(
	payload: Record<string, unknown> | null,
): ComplianceRoadmapActionId | null {
	const value = payload?.actionId;
	if (
		value === "prepare-sire" ||
		value === "collect-overdue-invoices" ||
		value === "stabilize-cashflow" ||
		value === "resolve-ledger-repro-mismatch"
	) {
		return value;
	}
	return null;
}

export function readDecision(
	payload: Record<string, unknown> | null,
): ComplianceRoadmapDecision | null {
	const value = payload?.decision;
	if (value === "APPROVE" || value === "REJECT" || value === "ESCALATE") {
		return value;
	}
	return null;
}

export function readReason(payload: Record<string, unknown> | null): string | null {
	const value = payload?.reason;
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}
