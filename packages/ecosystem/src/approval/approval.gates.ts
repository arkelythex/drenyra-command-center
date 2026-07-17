import { registerGate } from "./approval.registry";
import type { ApprovalAction, ApprovalGate } from "./approval.types";

export const connectorReconnectGate: ApprovalGate = {
	name: "connector-reconnect",
	description:
		"Requires approval for connector auto-reconnect after circuit break",
	level: "warning",
	matches(action: ApprovalAction): boolean {
		return action.type === "connector.reconnect";
	},
	autoApprove(): boolean {
		const mode = process.env.APPROVAL_AUTO_APPROVE;
		return mode === "true" || mode === "1";
	},
};

export const fiscalSubmitGate: ApprovalGate = {
	name: "fiscal-submit",
	description: "Requires approval for SUNAT fiscal document submission",
	level: "critical",
	matches(action: ApprovalAction): boolean {
		return action.type === "fiscal.submit";
	},
	autoApprove(): boolean {
		return false;
	},
};

export const systemRecoverGate: ApprovalGate = {
	name: "system-recover",
	description: "Requires approval for system recovery operations",
	level: "warning",
	matches(action: ApprovalAction): boolean {
		return action.type === "system.recover";
	},
	autoApprove(): boolean {
		return process.env.APPROVAL_AUTO_APPROVE === "true";
	},
};

export function createConnectorExecuteGate(
	connectorName: string,
	description: string,
	level: "info" | "warning" | "critical" = "info",
): ApprovalGate {
	return {
		name: `connector-execute-${connectorName}`,
		description:
			description || `Requires approval for ${connectorName} execution`,
		level,
		matches(action: ApprovalAction): boolean {
			return (
				action.type === "connector.execute" &&
				action.connectorName === connectorName
			);
		},
		autoApprove(): boolean {
			return level === "info" || process.env.APPROVAL_AUTO_APPROVE === "true";
		},
	};
}

export const DEFAULT_APPROVAL_GATES: ApprovalGate[] = [
	connectorReconnectGate,
	fiscalSubmitGate,
	systemRecoverGate,
];

export function initializeDefaultGates(): void {
	for (const gate of DEFAULT_APPROVAL_GATES) {
		registerGate(gate);
	}
}
