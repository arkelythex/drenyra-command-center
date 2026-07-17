export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
export type ApprovalLevel = "info" | "warning" | "critical";

export type ApprovalAction =
	| { type: "connector.reconnect"; connectorName: string }
	| { type: "connector.execute"; connectorName: string; operation: string }
	| { type: "fiscal.submit"; documentType: string; ruc: string }
	| { type: "system.recover"; component: string };

export interface ApprovalRequest {
	id: string;
	action: ApprovalAction;
	level: ApprovalLevel;
	status: ApprovalStatus;
	requestedBy: string;
	reason: string;
	context: Record<string, unknown>;
	createdAt: string;
	expiresAt: string;
	decidedBy?: string;
	decidedAt?: string;
	decisionNote?: string;
}

export interface ApprovalGate {
	name: string;
	description: string;
	level: ApprovalLevel;
	matches(action: ApprovalAction): boolean;
	autoApprove(context?: Record<string, unknown>): boolean;
}

export interface ApprovalManagerLike {
	requiresApproval(action: ApprovalAction): boolean;
	requestApproval(
		action: ApprovalAction,
		level: ApprovalLevel,
		reason: string,
		context?: Record<string, unknown>,
	): ApprovalRequest;
	waitForDecision(
		requestId: string,
		timeoutMs?: number,
	): Promise<ApprovalRequest>;
}
