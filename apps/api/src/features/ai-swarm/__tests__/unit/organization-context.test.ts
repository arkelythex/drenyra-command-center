import { afterEach, describe, expect, it } from "vitest";
import {
	resolveOrganizationContextForRequest,
	resolveOrganizationIdForAgentStream,
	validateCompanyIdMatchesTenant,
} from "../../api/organization-context";

describe("AI Swarm organization context", () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("resolves query orgId when no header context is present", () => {
		const headers = new Headers();

		expect(
			resolveOrganizationIdForAgentStream({ queryOrgId: "73", headers }),
		).toBe(73);
	});

	it("rejects conflicting explicit query and header organization context", () => {
		const headers = new Headers({ "x-organization-id": "42" });
		const result = resolveOrganizationContextForRequest({
			queryOrgId: "73",
			headers,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("TENANT_CONTEXT_CONFLICT");
			expect(result.details.values).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ source: "query.orgId", value: 73 }),
					expect.objectContaining({ source: "x-organization-id", value: 42 }),
				]),
			);
		}
	});

	it("uses header priority order when header values agree", () => {
		const headers = new Headers({
			"x-organization-id": "42",
			"x-org-id": "42",
			"x-tenant-id": "42",
			"x-company-id": "42",
		});

		expect(resolveOrganizationIdForAgentStream({ headers })).toBe(42);
	});

	it("ignores invalid and non-integer organization values", () => {
		const headers = new Headers({
			"x-organization-id": "42abc",
			"x-org-id": "-1",
			"x-tenant-id": "0",
		});
		delete process.env.AI_SWARM_DEFAULT_ORG_ID;

		expect(resolveOrganizationIdForAgentStream({ headers })).toBeNull();
	});

	it("uses default organization only when no explicit valid org is present", () => {
		process.env.AI_SWARM_DEFAULT_ORG_ID = "91";

		expect(
			resolveOrganizationIdForAgentStream({ headers: new Headers() }),
		).toBe(91);
	});

	it("requires SIRE body.companyId to match tenant header", () => {
		const result = validateCompanyIdMatchesTenant({
			bodyCompanyId: "cmp-1",
			headers: new Headers({ "x-company-id": "cmp-2" }),
		});

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe("TENANT_CONTEXT_CONFLICT");
	});
});
