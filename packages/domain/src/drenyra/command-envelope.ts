import { isCompleteDrenyraCapabilityScope } from "./capabilities";
import {
	type CreateDrenyraCommandEnvelopeInput,
	DRENYRA_COMMAND_STATUS,
	type DrenyraApprovalState,
	type DrenyraCommandDiff,
	type DrenyraCommandEnvelope,
	type DrenyraCommandEvidenceRef,
	type DrenyraDeterministicCheck,
} from "./command-envelope-types";

export * from "./command-envelope-types";

const DEFAULT_DIFF: DrenyraCommandDiff = {
	kind: "none",
	summary: "No material state diff proposed",
};

export function createDrenyraCommandEnvelope(
	input: CreateDrenyraCommandEnvelopeInput,
): DrenyraCommandEnvelope {
	assertNonEmpty(input.title, "title");
	assertNonEmpty(input.summary, "summary");
	assertNonEmpty(input.trace.traceId, "trace.traceId");
	assertNonEmpty(input.trace.createdAt, "trace.createdAt");
	if (!isCompleteDrenyraCapabilityScope(input.scope)) {
		throw new Error("DRENYRA_COMMAND_SCOPE_INCOMPLETE");
	}
	const evidence = input.evidence ?? [];
	const deterministicChecks = input.deterministicChecks ?? [];
	const approval = normalizeApproval(input.approval, input.status);
	assertEvidenceRefs(evidence);
	assertChecksReferenceEvidence(deterministicChecks, evidence);
	if (
		input.status === DRENYRA_COMMAND_STATUS.NEEDS_APPROVAL &&
		!approval.required
	) {
		throw new Error("DRENYRA_COMMAND_APPROVAL_REQUIRED");
	}
	return {
		commandId: input.commandId,
		status: input.status,
		scope: input.scope,
		title: input.title.trim(),
		summary: input.summary.trim(),
		riskLevel: input.riskLevel,
		evidence,
		deterministicChecks,
		approval,
		diff: input.diff ?? DEFAULT_DIFF,
		trace: input.trace,
	};
}

function normalizeApproval(
	approval: DrenyraApprovalState | undefined,
	status: CreateDrenyraCommandEnvelopeInput["status"],
): DrenyraApprovalState {
	if (approval) return approval;
	if (status === DRENYRA_COMMAND_STATUS.NEEDS_APPROVAL) {
		return {
			required: true,
			status: "pending",
			summary: "Human approval required",
		};
	}
	return {
		required: false,
		status: "not_required",
		summary: "No approval required",
	};
}

function assertEvidenceRefs(
	evidence: readonly DrenyraCommandEvidenceRef[],
): void {
	const ids = new Set<string>();
	for (const item of evidence) {
		assertNonEmpty(item.id, "evidence.id");
		assertNonEmpty(item.title, "evidence.title");
		if (ids.has(item.id)) throw new Error("DRENYRA_COMMAND_DUPLICATE_EVIDENCE");
		ids.add(item.id);
	}
}

function assertChecksReferenceEvidence(
	checks: readonly DrenyraDeterministicCheck[],
	evidence: readonly DrenyraCommandEvidenceRef[],
): void {
	const evidenceIds = new Set(evidence.map((item) => item.id));
	for (const check of checks) {
		assertNonEmpty(check.id, "check.id");
		assertNonEmpty(check.label, "check.label");
		assertNonEmpty(check.summary, "check.summary");
		for (const evidenceId of check.evidenceIds) {
			if (!evidenceIds.has(evidenceId)) {
				throw new Error("DRENYRA_COMMAND_CHECK_EVIDENCE_MISSING");
			}
		}
	}
}

function assertNonEmpty(value: string, field: string): void {
	if (value.trim().length === 0) throw new Error(`${field} is required`);
}
