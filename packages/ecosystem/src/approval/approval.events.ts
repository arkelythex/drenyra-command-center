import type { ApprovalRequest } from "./approval.types";

export type ApprovalEventType =
	| "approval.requested"
	| "approval.approved"
	| "approval.rejected"
	| "approval.expired";
export interface ApprovalEvent {
	type: ApprovalEventType;
	request: ApprovalRequest;
	timestamp: string;
}

type Listener = (event: ApprovalEvent) => void;
const listeners = new Map<ApprovalEventType, Set<Listener>>();

export function onApprovalEvent(
	type: ApprovalEventType,
	listener: Listener,
): void {
	if (!listeners.has(type)) listeners.set(type, new Set());
	listeners.get(type)?.add(listener);
}

export function offApprovalEvent(
	type: ApprovalEventType,
	listener: Listener,
): void {
	listeners.get(type)?.delete(listener);
}

export function emitApprovalEvent(
	type: ApprovalEventType,
	request: ApprovalRequest,
): void {
	const event: ApprovalEvent = {
		type,
		request,
		timestamp: new Date().toISOString(),
	};
	for (const listener of listeners.get(type) ?? []) {
		try {
			listener(event);
		} catch {
			/* swallow */
		}
	}
}
