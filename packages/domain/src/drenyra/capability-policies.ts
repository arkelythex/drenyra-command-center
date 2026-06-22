import {
	DRENYRA_CAPABILITY_RISK,
	DRENYRA_TOOL_ACTION,
	DRENYRA_TOOL_ID,
	type DrenyraCapabilityPolicy,
	type DrenyraCapabilityRisk,
	type DrenyraToolAction,
	type DrenyraToolId,
} from "./capability-types";
import type { DrenyraAgentType } from "./types";

function policy(
	agentType: DrenyraAgentType,
	toolId: DrenyraToolId,
	action: DrenyraToolAction,
	risk: DrenyraCapabilityRisk,
	requiresApproval: boolean,
): DrenyraCapabilityPolicy {
	return {
		agentType,
		toolId,
		action,
		risk,
		requiresApproval,
		requiresRedaction: true,
	};
}

export const DRENYRA_CAPABILITY_POLICIES: readonly DrenyraCapabilityPolicy[] = [
	policy(
		"FISCAL_REVIEWER_AGENT",
		DRENYRA_TOOL_ID.LIST_FISCAL_CASES,
		DRENYRA_TOOL_ACTION.READ,
		DRENYRA_CAPABILITY_RISK.LOW,
		false,
	),
	policy(
		"EVIDENCE_AGENT",
		DRENYRA_TOOL_ID.EXPLAIN_EVIDENCE,
		DRENYRA_TOOL_ACTION.EXPLAIN,
		DRENYRA_CAPABILITY_RISK.LOW,
		false,
	),
	policy(
		"FISCAL_REVIEWER_AGENT",
		DRENYRA_TOOL_ID.EXPLAIN_RISK,
		DRENYRA_TOOL_ACTION.EXPLAIN,
		DRENYRA_CAPABILITY_RISK.HIGH,
		false,
	),
	policy(
		"SIRE_AGENT",
		DRENYRA_TOOL_ID.RUN_AGENT_REVIEW,
		DRENYRA_TOOL_ACTION.DRAFT,
		DRENYRA_CAPABILITY_RISK.MEDIUM,
		false,
	),
	policy(
		"FISCAL_REVIEWER_AGENT",
		DRENYRA_TOOL_ID.CALCULATE_IGV,
		DRENYRA_TOOL_ACTION.EXPLAIN,
		DRENYRA_CAPABILITY_RISK.LOW,
		false,
	),
	policy(
		"CPE_AGENT",
		DRENYRA_TOOL_ID.VALIDATE_CPE,
		DRENYRA_TOOL_ACTION.DRAFT,
		DRENYRA_CAPABILITY_RISK.MEDIUM,
		false,
	),
	policy(
		"FISCAL_REVIEWER_AGENT",
		DRENYRA_TOOL_ID.GET_TAX_CALENDAR,
		DRENYRA_TOOL_ACTION.READ,
		DRENYRA_CAPABILITY_RISK.LOW,
		false,
	),
	policy(
		"LEDGER_AGENT",
		DRENYRA_TOOL_ID.PROPOSE_LEDGER_ENTRY,
		DRENYRA_TOOL_ACTION.PROPOSE,
		DRENYRA_CAPABILITY_RISK.HIGH,
		true,
	),
	policy(
		"FISCAL_REVIEWER_AGENT",
		DRENYRA_TOOL_ID.REQUEST_APPROVAL,
		DRENYRA_TOOL_ACTION.REQUEST_APPROVAL,
		DRENYRA_CAPABILITY_RISK.HIGH,
		false,
	),
	policy(
		"FISCAL_REVIEWER_AGENT",
		DRENYRA_TOOL_ID.PROMOTE_FISCAL_TRUTH,
		DRENYRA_TOOL_ACTION.MATERIAL_ACTION,
		DRENYRA_CAPABILITY_RISK.CRITICAL,
		true,
	),
] as const;
