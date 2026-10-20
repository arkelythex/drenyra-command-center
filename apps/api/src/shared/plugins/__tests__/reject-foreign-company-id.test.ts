import { describe, expect, it } from "vitest";
import { rejectForeignCompanyId } from "../company-scope-guard";

const companyContext = {
	userId: "user-1",
	authUserId: "user-1",
	legacyUserId: null,
	role: "admin",
	companyId: "cmp-1",
};

describe("rejectForeignCompanyId", () => {
	it("lets the session's own company through", () => {
		const set: { status?: number } = {};
		expect(
			rejectForeignCompanyId({
				query: { companyId: "cmp-1" },
				companyContext,
				set,
			}),
		).toBeUndefined();
		expect(
			rejectForeignCompanyId({
				body: { companyId: "cmp-1" },
				companyContext,
				set,
			}),
		).toBeUndefined();
		expect(set.status).toBeUndefined();
	});

	it("ignores requests that do not name a company", () => {
		const set: { status?: number } = {};
		expect(
			rejectForeignCompanyId({ query: {}, body: null, companyContext, set }),
		).toBeUndefined();
	});

	it("rejects another company in the query or the body", () => {
		for (const input of [
			{ query: { companyId: "cmp-2" } },
			{ body: { companyId: "cmp-2" } },
		]) {
			const set: { status?: number } = {};
			expect(
				rejectForeignCompanyId({ ...input, companyContext, set }),
			).toMatchObject({
				success: false,
				code: "COMPANY_SCOPE_MISMATCH",
			});
			expect(set.status).toBe(403);
		}
	});

	it("rejects when there is no session company to compare with", () => {
		const set: { status?: number } = {};
		expect(
			rejectForeignCompanyId({ query: { companyId: "cmp-1" }, set }),
		).toMatchObject({ code: "COMPANY_SCOPE_MISMATCH" });
		expect(set.status).toBe(403);
	});
});
