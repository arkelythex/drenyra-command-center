import { describe, expect, it } from "vitest";
import { evaluateDrenyraCapability } from "../capabilities";
import {
	DRENYRA_CAPABILITY_RISK,
	DRENYRA_TOOL_ACTION,
	DRENYRA_TOOL_ID,
	type DrenyraCapabilityGrant,
	type DrenyraCapabilityRequest,
} from "../capability-types";
import {
	evaluateFiscalGuardian,
	FISCAL_GUARDIAN_DECISION,
} from "../guardian-policies";
import type { DrenyraFiscalScope } from "../types";

const scope: DrenyraFiscalScope = {
	organizationId: "org-1",
	companyId: "cmp-1",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
};

function grant(
	overrides: Partial<DrenyraCapabilityGrant> = {},
): DrenyraCapabilityGrant {
	return {
		agentType: "FISCAL_REVIEWER_AGENT",
		toolId: DRENYRA_TOOL_ID.LIST_FISCAL_CASES,
		scope,
		grantedBy: "guardian",
		grantedAt: "2026-06-30T00:00:00.000Z",
		...overrides,
	};
}

function request(
	overrides: Partial<DrenyraCapabilityRequest> = {},
): DrenyraCapabilityRequest {
	return {
		agentType: "FISCAL_REVIEWER_AGENT",
		toolId: DRENYRA_TOOL_ID.LIST_FISCAL_CASES,
		scope,
		redactionOk: true,
		...overrides,
	};
}

describe("guardian-policies", () => {
	it("denies when capability evaluation denied", () => {
		const evaluation = evaluateDrenyraCapability({
			request: request({
				toolId: DRENYRA_TOOL_ID.SUBMIT_SUNAT_SIRE,
				agentType: "SIRE_AGENT",
			}),
			grants: [],
		});
		const result = evaluateFiscalGuardian({
			capabilityEvaluation: evaluation,
			request: request({
				toolId: DRENYRA_TOOL_ID.SUBMIT_SUNAT_SIRE,
				agentType: "SIRE_AGENT",
			}),
			policy: evaluation.policy,
		});
		expect(result.decision).toBe(FISCAL_GUARDIAN_DECISION.DENY);
	});

	it("never auto-allows material_action", () => {
		const req = request({
			agentType: "FISCAL_REVIEWER_AGENT",
			toolId: DRENYRA_TOOL_ID.PROMOTE_FISCAL_TRUTH,
			approvalId: "appr-1",
		});
		const evaluation = evaluateDrenyraCapability({
			request: req,
			grants: [grant(req)],
		});
		const result = evaluateFiscalGuardian({
			capabilityEvaluation: evaluation,
			request: req,
			policy: evaluation.policy,
		});
		expect(result.decision).toBe(FISCAL_GUARDIAN_DECISION.REQUIRE_HUMAN);
	});

	it("auto-allows read at low risk with redaction", () => {
		const evaluation = evaluateDrenyraCapability({
			request: request(),
			grants: [grant()],
		});
		expect(evaluation.policy.action).toBe(DRENYRA_TOOL_ACTION.READ);
		expect(evaluation.policy.risk).toBe(DRENYRA_CAPABILITY_RISK.LOW);
		const result = evaluateFiscalGuardian({
			capabilityEvaluation: evaluation,
			request: request(),
			policy: evaluation.policy,
		});
		expect(result.decision).toBe(FISCAL_GUARDIAN_DECISION.AUTO_ALLOW);
	});

	it("denies when redaction required but missing", () => {
		const evaluation = evaluateDrenyraCapability({
			request: request(),
			grants: [grant()],
		});
		const result = evaluateFiscalGuardian({
			capabilityEvaluation: evaluation,
			request: request({ redactionOk: false }),
			policy: evaluation.policy,
		});
		expect(result.decision).toBe(FISCAL_GUARDIAN_DECISION.DENY);
	});
});
