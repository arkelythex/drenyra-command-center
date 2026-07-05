import { describe, expect, it } from "vitest";
import type { TenantCompanyRucScope } from "../../src/control-plane";
import {
	deriveFiscalApprovalLevel,
	evaluateFiscalPolicy,
	FISCAL_POLICY_VIOLATION_CODES,
	resolveFiscalToolMapping,
} from "../../src/control-plane";

const validScope: TenantCompanyRucScope = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

describe("evaluateFiscalPolicy", () => {
	it("blocks high SUNAT actions when RUC scope is missing", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-1",
			toolName: "cpe.issue",
			action: "execute",
			tenantScope: { ...validScope, ruc: undefined },
			sunatImpact: "high",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain(
			FISCAL_POLICY_VIOLATION_CODES.FISCAL_SCOPE_REQUIRED,
		);
	});

	it("allows low impact actions and derives notify approval", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-2",
			toolName: "cpe.lookup",
			action: "read",
			tenantScope: validScope,
			sunatImpact: "low",
		});

		expect(result.allowed).toBe(true);
		expect(result.approvalLevel).toBe("notify");
		expect(result.requiresApproval).toBe(false);
	});

	it("requires gate for medium impact actions", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-3",
			toolName: "tax.calculate-igv",
			action: "execute",
			tenantScope: validScope,
			sunatImpact: "medium",
			deterministicEngineRef: "tax-engine:v1",
		});

		expect(result.allowed).toBe(true);
		expect(result.approvalLevel).toBe("gate");
		expect(result.requiresApproval).toBe(true);
	});

	it("requires fiscal gate for high impact actions", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-4",
			toolName: "cpe.issue",
			action: "execute",
			tenantScope: validScope,
			sunatImpact: "high",
		});

		expect(result.allowed).toBe(true);
		expect(result.approvalLevel).toBe("fiscal_gate");
		expect(result.requiresApproval).toBe(true);
	});

	it("denies critical impact actions by default", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-5",
			toolName: "cpe.void-accepted",
			action: "execute",
			tenantScope: validScope,
			sunatImpact: "critical",
		});

		expect(result.allowed).toBe(false);
		expect(result.approvalLevel).toBe("deny");
		expect(result.violations).toContain(
			FISCAL_POLICY_VIOLATION_CODES.CRITICAL_SUNAT_IMPACT_DENIED,
		);
	});

	it("denies mutations against closed accounting periods", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-6",
			toolName: "journal.post",
			action: "write",
			tenantScope: validScope,
			accountingPeriodStatus: "closed",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain(
			FISCAL_POLICY_VIOLATION_CODES.ACCOUNTING_PERIOD_CLOSED,
		);
	});

	it("denies direct mutation of accepted CPE documents", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-7",
			toolName: "cpe.update",
			action: "write",
			tenantScope: validScope,
			documentType: "cpe",
			documentStatus: "accepted",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain(
			FISCAL_POLICY_VIOLATION_CODES.CPE_IMMUTABLE,
		);
	});

	it("denies SIRE export without evidence", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-8",
			toolName: "sire.export",
			action: "execute",
			tenantScope: validScope,
			evidenceRefs: [],
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain(
			FISCAL_POLICY_VIOLATION_CODES.EVIDENCE_REQUIRED,
		);
	});

	it("denies tax calculations without deterministic engine", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-9",
			toolName: "tax.calculate-igv",
			action: "execute",
			tenantScope: validScope,
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain(
			FISCAL_POLICY_VIOLATION_CODES.DETERMINISTIC_ENGINE_REQUIRED,
		);
	});

	it("maps fiscal tool families explicitly", () => {
		expect(resolveFiscalToolMapping("cpe.issue")?.defaultSunatImpact).toBe(
			"high",
		);
		expect(resolveFiscalToolMapping("sire.export")?.requiresEvidence).toBe(
			true,
		);
		expect(
			resolveFiscalToolMapping("tax.calculate-igv")
				?.requiresDeterministicEngine,
		).toBe(true);
	});

	it("keeps non-fiscal tools auto-approved by fiscal policy", () => {
		const result = evaluateFiscalPolicy({
			traceId: "trace-10",
			toolName: "report.view",
			action: "read",
		});

		expect(result.allowed).toBe(true);
		expect(result.sunatImpact).toBe("none");
		expect(result.approvalLevel).toBe(deriveFiscalApprovalLevel("none"));
	});
});
