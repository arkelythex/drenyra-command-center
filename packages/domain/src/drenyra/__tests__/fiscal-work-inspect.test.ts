import { describe, expect, it } from "vitest";
import {
	DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
	type DrenyraFiscalWorkInspectRequest,
	validateDrenyraFiscalWorkInspectRequest,
} from "../fiscal-work-inspect";

const request: DrenyraFiscalWorkInspectRequest = {
	scope: {
		organizationId: "org-001",
		companyId: "company-001",
		companyRuc: "20100070970",
		period: "2026-05",
		countryCode: "PE",
		actorId: "user-001",
	},
	workItemId: "case-001",
	grantedCapabilities: [DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY],
};

describe("Drenyra fiscal work inspect contract", () => {
	it("allows an explicitly scoped request with the inspect capability", () => {
		expect(validateDrenyraFiscalWorkInspectRequest(request)).toBe("ALLOWED");
	});

	it("fails closed for missing or invalid fiscal scope", () => {
		expect(
			validateDrenyraFiscalWorkInspectRequest({
				...request,
				scope: { ...request.scope, companyRuc: "" },
			}),
		).toBe("MISSING_SCOPE");
		expect(
			validateDrenyraFiscalWorkInspectRequest({
				...request,
				scope: { ...request.scope, companyRuc: "20100070971" },
			}),
		).toBe("INVALID_SCOPE");
	});

	it("denies callers without drenyra.fiscal-work.inspect grant", () => {
		expect(
			validateDrenyraFiscalWorkInspectRequest({
				...request,
				grantedCapabilities: ["drenyra.fiscal-work.list"],
			}),
		).toBe("CAPABILITY_DENIED");
	});
});
