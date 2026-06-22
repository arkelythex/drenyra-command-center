import type {
	ComplianceContext,
	ComplianceFinding,
	ComplianceSeverity,
} from "./compliance.types";

const severityWeights: Record<ComplianceSeverity, number> = {
	info: 0,
	low: 10,
	medium: 30,
	high: 65,
	critical: 100,
};

export function assertScopedContext(context: ComplianceContext): void {
	const hasTenantScope = Boolean(context.tenantId || context.companyId || context.ruc);
	if (!hasTenantScope && !context.userId) {
		throw new Error("Compliance context requires tenant, company, RUC, or user scope");
	}
}

export function createFinding(input: {
	readonly severity: ComplianceSeverity;
	readonly category: string;
	readonly message: string;
	readonly evidenceRefs?: readonly string[];
	readonly recommendedAction: string;
	readonly requiresApproval?: boolean;
}): ComplianceFinding {
	const evidenceRefs = [...(input.evidenceRefs ?? [])].sort();
	const stableKey = [
		input.severity,
		input.category,
		input.message,
		input.recommendedAction,
		evidenceRefs.join("|"),
	].join("::");

	return {
		id: `finding-${stableHash(stableKey)}`,
		severity: input.severity,
		category: input.category,
		message: input.message,
		evidenceRefs,
		recommendedAction: input.recommendedAction,
		requiresApproval: input.requiresApproval ?? input.severity === "critical",
	};
}

export function riskScoreFromFindings(
	findings: readonly ComplianceFinding[],
): number {
	if (findings.length === 0) {
		return 0;
	}

	const score = findings.reduce(
		(total, finding) => total + severityWeights[finding.severity],
		0,
	);

	return Math.min(100, Math.round(score / Math.max(1, findings.length)));
}

export function pickComplianceContext(input: {
	readonly payload?: Record<string, unknown>;
	readonly metadata?: Record<string, unknown>;
	readonly traceId?: string;
}): ComplianceContext {
	const source = readRecord(input.payload?.context) ?? input.payload ?? {};
	const metadata = input.metadata ?? {};

	return {
		tenantId: readString(source.tenantId) ?? readString(metadata.tenantId),
		companyId: readString(source.companyId) ?? readString(metadata.companyId),
		ruc: readString(source.ruc) ?? readString(metadata.ruc),
		userId: readString(source.userId) ?? readString(metadata.userId),
		period: readString(source.period) ?? readString(metadata.period),
		traceId:
			readString(source.traceId) ??
			readString(input.payload?.traceId) ??
			readString(input.traceId),
	};
}

export function requireComplianceScope(input: {
	readonly payload?: Record<string, unknown>;
	readonly metadata?: Record<string, unknown>;
	readonly traceId?: string;
}): ComplianceContext {
	const context = pickComplianceContext(input);
	assertScopedContext(context);
	return context;
}

export function readRecord(value: unknown): Record<string, unknown> | undefined {
	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return undefined;
}

export function readString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0
		? value
		: undefined;
}

export function readStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((item): item is string => typeof item === "string");
}

function stableHash(value: string): string {
	let hash = 0x811c9dc5;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}
