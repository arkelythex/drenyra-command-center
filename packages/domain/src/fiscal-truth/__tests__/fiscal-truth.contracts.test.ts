import { describe, expect, it } from "vitest";
import { EVIDENCE_NODE_KIND, REPLAY_FAILURE_CODE } from "../constants";
import {
	canPromoteAuthoritativeTruth,
	isFiscalTruthScope,
	toReplayFailureResult,
} from "../types";

describe("Fiscal Truth contracts", () => {
	it("rejects scope when company is missing or RUC checksum is invalid", () => {
		const invalidCompanyScope = {
			companyId: "",
			companyRuc: "20123456786",
			organizationId: null,
			period: "2026-05",
			countryCode: "PE",
		};
		const invalidChecksumScope = {
			companyId: "company-001",
			companyRuc: "20123456780",
			organizationId: null,
			period: "2026-05",
			countryCode: "PE",
		};

		expect(isFiscalTruthScope(invalidCompanyScope)).toBe(false);
		expect(isFiscalTruthScope(invalidChecksumScope)).toBe(false);
	});

	it("rejects scope when fiscal period is not YYYY-MM", () => {
		expect(
			isFiscalTruthScope({
				companyId: "company-001",
				companyRuc: "20123456786",
				organizationId: null,
				period: "2026-13",
				countryCode: "PE",
			}),
		).toBe(false);
	});

	it("accepts scope only when the RUC passes SUNAT checksum", () => {
		expect(
			isFiscalTruthScope({
				companyId: "company-001",
				companyRuc: "20123456786",
				organizationId: null,
				period: "2026-05",
				countryCode: "PE",
			}),
		).toBe(true);
	});

	it("does not allow advisory evidence to become authoritative", () => {
		expect(
			canPromoteAuthoritativeTruth({
				evidenceNodeKind: "ai_suggestion",
				hasDeterministicValidation: true,
				hasRequiredApproval: true,
			}),
		).toBe(false);
	});

	it("requires evidence root link for authoritative promotion", () => {
		expect(
			canPromoteAuthoritativeTruth({
				evidenceNodeKind: EVIDENCE_NODE_KIND.SOURCE_INPUT,
				hasDeterministicValidation: true,
				hasRequiredApproval: true,
				hasSameScopeGraphLinks: true,
				hasApprovedGovernancePolicyDecision: true,
				hasHumanMaterialApproval: true,
				evidenceRootNodeId: "",
			}),
		).toBe(false);
	});

	it("requires same-scope graph links, governance policy and material human approval", () => {
		const base = {
			evidenceNodeKind: EVIDENCE_NODE_KIND.SOURCE_INPUT,
			hasDeterministicValidation: true,
			hasRequiredApproval: true,
			evidenceRootNodeId: "evidence-root-001",
		};

		expect(
			canPromoteAuthoritativeTruth({
				...base,
				hasSameScopeGraphLinks: true,
				hasApprovedGovernancePolicyDecision: true,
				hasHumanMaterialApproval: true,
			}),
		).toBe(true);
		expect(
			canPromoteAuthoritativeTruth({
				...base,
				hasSameScopeGraphLinks: false,
				hasApprovedGovernancePolicyDecision: true,
				hasHumanMaterialApproval: true,
			}),
		).toBe(false);
		expect(
			canPromoteAuthoritativeTruth({
				...base,
				hasSameScopeGraphLinks: true,
				hasApprovedGovernancePolicyDecision: false,
				hasHumanMaterialApproval: true,
			}),
		).toBe(false);
		expect(
			canPromoteAuthoritativeTruth({
				...base,
				hasSameScopeGraphLinks: true,
				hasApprovedGovernancePolicyDecision: true,
				hasHumanMaterialApproval: false,
			}),
		).toBe(false);
	});

	it("returns explicit replay failure code when evidence is missing", () => {
		const result = toReplayFailureResult(
			REPLAY_FAILURE_CODE.MISSING_EVIDENCE,
			"Missing evidence bundle",
		);

		expect(result.success).toBe(false);
		expect(result.failureCode).toBe(REPLAY_FAILURE_CODE.MISSING_EVIDENCE);
	});
});
