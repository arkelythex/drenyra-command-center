import type { AgentContext, ApprovalRequest } from "@arkelythex/drenyra-orchestrator";

export interface SseApprovalEvent {
	id: string;
	toolName: string;
	summary: string;
	module: string;
	approvalLevel: string;
	state: string;
	proposedAt: string;
	companyId: string;
	ruc: string;
}

export function toApprovalSseChunk(event: string, payload: unknown): string {
	return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export function formatApproval(a: ApprovalRequest): SseApprovalEvent {
	return {
		id: a.id,
		toolName: a.toolName,
		summary: a.governanceResult?.reasons?.join(", ") || `Execute ${a.toolName}`,
		module: a.toolName.split("_")[0] || a.toolName,
		approvalLevel: a.approvalLevel,
		state: a.state,
		proposedAt: a.proposedAt.toISOString(),
		companyId: a.context.companyId,
		ruc: a.context.ruc,
	};
}

export function approvalMatchesContext(
	approval: ApprovalRequest,
	context: AgentContext,
): boolean {
	return (
		approval.context.tenantId === context.tenantId &&
		approval.context.companyId === context.companyId
	);
}

export function approvalNotFound() {
	return {
		ok: false as const,
		error: "Approval request not found",
		code: "NOT_FOUND",
	};
}

export function readReviewerRole(
	headers: Record<string, string | undefined>,
): string | null {
	const role = headers["x-user-role"]?.trim();
	return role ? role : null;
}
