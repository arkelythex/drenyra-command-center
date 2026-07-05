import { describe, expect, it } from "vitest";
import {
	DRENYRA_CAPABILITY_DECISION,
	DRENYRA_TOOL_ID,
	type DrenyraCapabilityGrant,
	type DrenyraCapabilityRequest,
	type DrenyraFiscalScope,
	evaluateDrenyraCapability,
} from "./index";

const scope: DrenyraFiscalScope = {
	organizationId: "org_123",
	companyId: "company_123",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
};

function grant(
	overrides: Partial<DrenyraCapabilityGrant> = {},
): DrenyraCapabilityGrant {
	return {
		agentType: "EVIDENCE_AGENT",
		toolId: DRENYRA_TOOL_ID.EXPLAIN_EVIDENCE,
		scope,
		grantedBy: "guardian",
		grantedAt: "2026-05-26T00:00:00.000Z",
		...overrides,
	};
}

function request(
	overrides: Partial<DrenyraCapabilityRequest> = {},
): DrenyraCapabilityRequest {
	return {
		agentType: "EVIDENCE_AGENT",
		toolId: DRENYRA_TOOL_ID.EXPLAIN_EVIDENCE,
		scope,
		redactionOk: true,
		...overrides,
	};
}

describe("Drenyra capability matrix", () => {
	it("denies by default when a scoped grant is missing", () => {
		const result = evaluateDrenyraCapability({
			request: request(),
			grants: [],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.DENIED);
		expect(result.reason).toBe("Capability grant is missing");
		expect(result.auditEventType).toBe("CAPABILITY_DENIED");
	});

	it("allows a read/explain tool only with matching scoped grant", () => {
		const result = evaluateDrenyraCapability({
			request: request(),
			grants: [grant()],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.ALLOWED);
		expect(result.auditEventType).toBe("CAPABILITY_ALLOWED");
	});

	it("denies when redaction fails", () => {
		const result = evaluateDrenyraCapability({
			request: request({ redactionOk: false }),
			grants: [grant()],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.DENIED);
		expect(result.reason).toBe("Required redaction failed");
	});

	it("allows explain-risk as high-risk advisory when scoped and redacted", () => {
		const result = evaluateDrenyraCapability({
			request: request({
				agentType: "FISCAL_REVIEWER_AGENT",
				toolId: DRENYRA_TOOL_ID.EXPLAIN_RISK,
			}),
			grants: [
				grant({
					agentType: "FISCAL_REVIEWER_AGENT",
					toolId: DRENYRA_TOOL_ID.EXPLAIN_RISK,
				}),
			],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.ALLOWED);
		expect(result.policy.risk).toBe("high");
		expect(result.policy.requiresApproval).toBe(false);
	});

	it("denies high-risk proposal without approval", () => {
		const result = evaluateDrenyraCapability({
			request: request({
				agentType: "LEDGER_AGENT",
				toolId: DRENYRA_TOOL_ID.PROPOSE_LEDGER_ENTRY,
			}),
			grants: [
				grant({
					agentType: "LEDGER_AGENT",
					toolId: DRENYRA_TOOL_ID.PROPOSE_LEDGER_ENTRY,
				}),
			],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.DENIED);
		expect(result.reason).toBe("Required approval is missing");
	});

	it("allows high-risk proposal with approval and matching grant", () => {
		const result = evaluateDrenyraCapability({
			request: request({
				agentType: "LEDGER_AGENT",
				toolId: DRENYRA_TOOL_ID.PROPOSE_LEDGER_ENTRY,
				approvalId: "approval_123",
			}),
			grants: [
				grant({
					agentType: "LEDGER_AGENT",
					toolId: DRENYRA_TOOL_ID.PROPOSE_LEDGER_ENTRY,
				}),
			],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.ALLOWED);
	});

	it("denies cross-period grant reuse", () => {
		const result = evaluateDrenyraCapability({
			request: request({ scope: { ...scope, period: "2026-06" } }),
			grants: [grant()],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.DENIED);
		expect(result.reason).toBe("Capability grant is missing");
	});

	it("denies incomplete fiscal scope", () => {
		const result = evaluateDrenyraCapability({
			request: request({ scope: { ...scope, organizationId: undefined } }),
			grants: [grant()],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.DENIED);
		expect(result.reason).toBe("Capability scope is incomplete");
	});

	it("denies invalid RUC checksums in capability scope", () => {
		const result = evaluateDrenyraCapability({
			request: request({ scope: { ...scope, companyRuc: "20123456780" } }),
			grants: [grant()],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.DENIED);
		expect(result.reason).toBe("Capability scope is incomplete");
	});

	it("denies unregistered material tools", () => {
		const result = evaluateDrenyraCapability({
			request: request({ toolId: DRENYRA_TOOL_ID.SUBMIT_SUNAT_SIRE }),
			grants: [grant({ toolId: DRENYRA_TOOL_ID.SUBMIT_SUNAT_SIRE })],
		});

		expect(result.decision).toBe(DRENYRA_CAPABILITY_DECISION.DENIED);
		expect(result.reason).toBe("Capability is not registered");
	});
});
