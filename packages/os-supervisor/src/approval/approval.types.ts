import type { OSAgentContext } from "../types/agent.types.js";
import type { OSApprovalLevel } from "../types/approval.types.js";

export type OSApprovalState =
	| "proposed"
	| "approved"
	| "rejected"
	| "cancelled";

export interface OSApprovalRequest {
	id: string;
	toolName: string;
	input: unknown;
	context: OSAgentContext;
	approvalLevel: OSApprovalLevel;
	state: OSApprovalState;
	proposedAt: Date;
	decidedAt?: Date;
	reviewerId?: string;
	rationale?: string;
}
