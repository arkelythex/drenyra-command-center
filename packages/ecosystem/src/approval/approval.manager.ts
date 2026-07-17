import { emitApprovalEvent } from "./approval.events";
import { requiresApproval } from "./approval.registry";
import type {
	ApprovalAction,
	ApprovalLevel,
	ApprovalRequest,
} from "./approval.types";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const requests = new Map<string, ApprovalRequest>();
const history: ApprovalRequest[] = [];
const pendingResolvers = new Map<string, Set<(req: ApprovalRequest) => void>>();
const HISTORY_MAX = 100;

export class ApprovalExpiredError extends Error {
	constructor(public readonly request: ApprovalRequest) {
		super(
			`Approval EXPIRED for ${describeAction(request.action)}. ID: ${request.id}`,
		);
		this.name = "ApprovalExpiredError";
	}
}

export class ApprovalRejectedError extends Error {
	constructor(public readonly request: ApprovalRequest) {
		super(
			`Approval REJECTED for ${describeAction(request.action)}. Reason: ${request.decisionNote ?? "No reason"}`,
		);
		this.name = "ApprovalRejectedError";
	}
}

export class ApprovalPendingError extends Error {
	constructor(public readonly request: ApprovalRequest) {
		super(
			`Approval PENDING for ${describeAction(request.action)}. ID: ${request.id}`,
		);
		this.name = "ApprovalPendingError";
	}
}

function describeAction(action: ApprovalAction): string {
	switch (action.type) {
		case "connector.reconnect":
			return `reconnect ${action.connectorName}`;
		case "connector.execute":
			return `execute ${action.operation} on ${action.connectorName}`;
		case "fiscal.submit":
			return `submit ${action.documentType} for RUC ${action.ruc}`;
		case "system.recover":
			return `recover ${action.component}`;
	}
}

export function requestApproval(
	action: ApprovalAction,
	level: ApprovalLevel,
	reason: string,
	context: Record<string, unknown> = {},
): ApprovalRequest {
	const id = crypto.randomUUID();
	const now = new Date();
	const request: ApprovalRequest = {
		id,
		action,
		level,
		status: "pending",
		requestedBy: (context.requestedBy as string) ?? "system",
		reason,
		context,
		createdAt: now.toISOString(),
		expiresAt: new Date(now.getTime() + TWO_HOURS_MS).toISOString(),
	};
	requests.set(id, request);
	emitApprovalEvent("approval.requested", request);
	return request;
}

export function approve(
	requestId: string,
	decidedBy: string,
	note?: string,
): ApprovalRequest {
	const request = requests.get(requestId);
	if (!request) throw new Error(`Approval request ${requestId} not found`);
	if (request.status !== "pending")
		throw new Error(`Already ${request.status}`);
	request.status = "approved";
	request.decidedBy = decidedBy;
	request.decidedAt = new Date().toISOString();
	request.decisionNote = note;
	moveToHistory(request);
	emitApprovalEvent("approval.approved", request);
	resolvePending(request);
	return request;
}

export function reject(
	requestId: string,
	decidedBy: string,
	note?: string,
): ApprovalRequest {
	const request = requests.get(requestId);
	if (!request) throw new Error(`Approval request ${requestId} not found`);
	if (request.status !== "pending")
		throw new Error(`Already ${request.status}`);
	request.status = "rejected";
	request.decidedBy = decidedBy;
	request.decidedAt = new Date().toISOString();
	request.decisionNote = note;
	moveToHistory(request);
	emitApprovalEvent("approval.rejected", request);
	resolvePending(request);
	return request;
}

export async function waitForDecision(
	requestId: string,
	timeoutMs?: number,
): Promise<ApprovalRequest> {
	const request = requests.get(requestId);
	if (!request) throw new Error(`Approval request ${requestId} not found`);
	if (request.status !== "pending") return request;
	return new Promise<ApprovalRequest>((resolve) => {
		const timeout = timeoutMs ?? TWO_HOURS_MS;
		let resolvers = pendingResolvers.get(requestId);
		if (!resolvers) {
			resolvers = new Set();
			pendingResolvers.set(requestId, resolvers);
		}
		resolvers.add(resolve);
		setTimeout(() => {
			resolvers?.delete(resolve);
			const current = requests.get(requestId);
			if (current && current.status === "pending") {
				current.status = "expired";
				moveToHistory(current);
				emitApprovalEvent("approval.expired", current);
			}
			resolve(current ?? request);
		}, timeout);
	});
}

export function getPendingRequests(): ApprovalRequest[] {
	return Array.from(requests.values());
}
export function getHistory(limit?: number): ApprovalRequest[] {
	return history.slice(0, limit ?? HISTORY_MAX);
}

export function expireStaleRequests(): number {
	const now = Date.now();
	let count = 0;
	for (const [, request] of requests) {
		if (
			request.status === "pending" &&
			new Date(request.expiresAt).getTime() <= now
		) {
			request.status = "expired";
			moveToHistory(request);
			emitApprovalEvent("approval.expired", request);
			count++;
		}
	}
	return count;
}

export function checkRequiresApproval(action: ApprovalAction): boolean {
	return requiresApproval(action);
}
export function clearApprovalRequests(): void {
	requests.clear();
	history.length = 0;
	pendingResolvers.clear();
}

function moveToHistory(request: ApprovalRequest): void {
	requests.delete(request.id);
	history.unshift(request);
	if (history.length > HISTORY_MAX) history.pop();
}

function resolvePending(request: ApprovalRequest): void {
	const resolvers = pendingResolvers.get(request.id);
	if (resolvers) {
		for (const resolve of resolvers) resolve(request);
		pendingResolvers.delete(request.id);
	}
}
