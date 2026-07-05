import { describe, expect, it } from "vitest";
import {
	type DrenyraToolCapabilityManifest,
	evaluateDrenyraToolGovernance,
} from "../governance";
import type { FiscalScope } from "../types";

const scope: FiscalScope = {
	organizationId: "org-001",
	companyId: "company-001",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
};

const fiscalGateManifest: DrenyraToolCapabilityManifest = {
	toolName: "submit_sire",
	capability: "sunat.sire.submit",
	riskLevel: "HIGH",
	approvalLevel: "fiscal_gate",
	allowedScopes: [scope],
	redactionRequired: true,
};

describe("Drenyra agent governance", () => {
	it("denies tools that are not registered in the capability matrix", () => {
		expect(
			evaluateDrenyraToolGovernance({
				scope,
				hasHumanApproval: true,
				redactionStatus: "passed",
			}),
		).toEqual({ allowed: false, reason: "TOOL_NOT_REGISTERED" });
	});

	it("denies cross-scope execution without leaking fiscal authority", () => {
		expect(
			evaluateDrenyraToolGovernance({
				manifest: fiscalGateManifest,
				scope: { ...scope, companyRuc: "20100070970" },
				hasHumanApproval: true,
				redactionStatus: "passed",
			}),
		).toEqual({ allowed: false, reason: "SCOPE_NOT_ALLOWED" });
	});

	it("requires human approval for material SUNAT/SIRE actions", () => {
		expect(
			evaluateDrenyraToolGovernance({
				manifest: fiscalGateManifest,
				scope,
				hasHumanApproval: false,
				redactionStatus: "passed",
			}),
		).toEqual({ allowed: false, reason: "HUMAN_APPROVAL_REQUIRED" });
	});

	it("fails closed when required redaction fails", () => {
		expect(
			evaluateDrenyraToolGovernance({
				manifest: fiscalGateManifest,
				scope,
				hasHumanApproval: true,
				redactionStatus: "failed",
			}),
		).toEqual({ allowed: false, reason: "REDACTION_FAILED" });
	});

	it("allows registered, same-scope, redacted and approved fiscal execution", () => {
		expect(
			evaluateDrenyraToolGovernance({
				manifest: fiscalGateManifest,
				scope,
				hasHumanApproval: true,
				redactionStatus: "passed",
			}),
		).toEqual({ allowed: true, reason: "ALLOWED" });
	});
});
