import type { ApprovalRequest } from "../types/approval-gate";

/**
 * Simple in-memory approval store.
 * Replaced by Engram in Phase 5 for fiscal persistence.
 */
export class ApprovalStore {
	private readonly requests = new Map<string, ApprovalRequest>();

	save(request: ApprovalRequest): void {
		this.requests.set(request.id, request);
	}

	get(id: string): ApprovalRequest | undefined {
		return this.requests.get(id);
	}

	update(id: string, partial: Partial<ApprovalRequest>): void {
		const existing = this.requests.get(id);
		if (existing) {
			Object.assign(existing, partial);
		}
	}

	listByState(state: string): ApprovalRequest[] {
		return Array.from(this.requests.values()).filter((r) => r.state === state);
	}

	listByContext(context: { tenantId: string }): ApprovalRequest[] {
		return Array.from(this.requests.values()).filter(
			(r) => r.context.tenantId === context.tenantId,
		);
	}

	getAll(): ApprovalRequest[] {
		return Array.from(this.requests.values());
	}
}
