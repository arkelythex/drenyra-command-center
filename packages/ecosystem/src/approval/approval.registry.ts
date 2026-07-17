import type { ApprovalAction, ApprovalGate } from "./approval.types";

const gates: ApprovalGate[] = [];

export function registerGate(gate: ApprovalGate): void {
	if (gates.some((g) => g.name === gate.name)) return;
	gates.push(gate);
}

export function unregisterGate(name: string): void {
	const idx = gates.findIndex((g) => g.name === name);
	if (idx >= 0) gates.splice(idx, 1);
}

export function listGates(): ApprovalGate[] {
	return [...gates];
}

export function getGatesForAction(action: ApprovalAction): ApprovalGate[] {
	return gates.filter((g) => g.matches(action));
}

export function requiresApproval(action: ApprovalAction): boolean {
	return getGatesForAction(action).length > 0;
}

export function clearGates(): void {
	gates.length = 0;
}
