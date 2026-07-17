import type { OSApprovalRequest, OSApprovalState } from "./approval.types.js";

export interface OSApprovalStore {
	propose(request: OSApprovalRequest): Promise<void>;
	get(id: string): Promise<OSApprovalRequest | undefined>;
	list(filter?: { state?: OSApprovalState }): Promise<OSApprovalRequest[]>;
	approve(id: string, reviewerId: string, rationale?: string): Promise<void>;
	reject(id: string, reviewerId: string, rationale?: string): Promise<void>;
	cancel(id: string): Promise<void>;
	getPending(): Promise<OSApprovalRequest[]>;
}

export class InMemoryApprovalStore implements OSApprovalStore {
	private readonly requests = new Map<string, OSApprovalRequest>();

	async propose(request: OSApprovalRequest): Promise<void> {
		this.requests.set(request.id, { ...request });
	}

	async get(id: string): Promise<OSApprovalRequest | undefined> {
		const found = this.requests.get(id);
		return found ? { ...found } : undefined;
	}

	async list(filter?: {
		state?: OSApprovalState;
	}): Promise<OSApprovalRequest[]> {
		const all = Array.from(this.requests.values());
		if (filter?.state) {
			return all.filter((r) => r.state === filter.state).map((r) => ({ ...r }));
		}
		return all.map((r) => ({ ...r }));
	}

	async approve(
		id: string,
		reviewerId: string,
		rationale?: string,
	): Promise<void> {
		const request = this.requests.get(id);
		if (!request) {
			throw new Error(`Approval request ${id} not found`);
		}
		if (request.state === "approved") {
			throw new Error(`Approval request ${id} is already approved`);
		}
		if (request.state === "rejected") {
			throw new Error(`Approval request ${id} is already rejected`);
		}
		if (request.state === "cancelled") {
			throw new Error(`Approval request ${id} is already cancelled`);
		}
		request.state = "approved";
		request.reviewerId = reviewerId;
		request.rationale = rationale;
		request.decidedAt = new Date();
	}

	async reject(
		id: string,
		reviewerId: string,
		rationale?: string,
	): Promise<void> {
		const request = this.requests.get(id);
		if (!request) {
			throw new Error(`Approval request ${id} not found`);
		}
		if (request.state !== "proposed") {
			throw new Error(
				`Approval request ${id} is already ${request.state}; cannot reject`,
			);
		}
		request.state = "rejected";
		request.reviewerId = reviewerId;
		request.rationale = rationale;
		request.decidedAt = new Date();
	}

	async cancel(id: string): Promise<void> {
		const request = this.requests.get(id);
		if (!request) {
			throw new Error(`Approval request ${id} not found`);
		}
		if (request.state !== "proposed") {
			throw new Error(
				`Approval request ${id} is already ${request.state}; cannot cancel`,
			);
		}
		request.state = "cancelled";
		request.decidedAt = new Date();
	}

	async getPending(): Promise<OSApprovalRequest[]> {
		return Array.from(this.requests.values())
			.filter((r) => r.state === "proposed")
			.map((r) => ({ ...r }));
	}
}
