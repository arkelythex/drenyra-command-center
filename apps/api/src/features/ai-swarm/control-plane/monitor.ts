import type { EvidenceTraceBundle, TraceEvidenceStore } from "@drenyra/ai";
import type { ApprovalRecord } from "./types";

export const toApprovalLineage = (
	approval: ApprovalRecord,
): NonNullable<EvidenceTraceBundle["approvalLineage"]> => ({
	approvalId: approval.approvalId,
	approvalStatus: approval.state,
	decision:
		approval.state === "approved"
			? "approved"
			: approval.state === "rejected"
				? "rejected"
				: "pending",
	decisionEvidenceRef: `policy://${approval.approvalId}`,
	decisionEvidenceRedacted: true,
});

export const syncTraceApprovalLineage = (
	traceEvidenceStore: TraceEvidenceStore,
	approval: ApprovalRecord,
): void => {
	traceEvidenceStore.updateApprovalLineage({
		traceId: approval.traceId,
		tenantScope: approval.scope,
		approvalLineage: toApprovalLineage(approval),
	});
};

export const appendApprovalAuditEvent = (
	traceEvidenceStore: TraceEvidenceStore,
	approval: ApprovalRecord,
	eventType:
		| "approval.requested"
		| "approval.approved"
		| "provider.apply.failed",
	status: "success" | "failure",
	reasonCode: string,
	actor: {
		actorId: string;
		actorRole: "system" | "supervisor" | "financial-controller";
	},
): void => {
	traceEvidenceStore.appendAuditEvent({
		traceId: approval.traceId,
		tenantScope: approval.scope,
		event: {
			eventType,
			status,
			recordedAt: new Date().toISOString(),
			actorId: actor.actorId,
			actorRole: actor.actorRole,
			reasonCode,
		},
	});
};
