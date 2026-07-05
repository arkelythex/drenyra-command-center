import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	transaction: vi.fn(),
}));

vi.mock("../../../lib/db", () => ({
	db: {
		transaction: mocks.transaction,
	},
}));

import {
	applyTenantRlsContext,
	withCompanyRlsTransaction,
	withTenantRlsTransaction,
} from "../rls-db-context";

describe("rls-db-context", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("applies transaction-local tenant settings to an executor", async () => {
		const execute = vi.fn().mockResolvedValue(undefined);

		await applyTenantRlsContext(
			{ execute },
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				userId: "usr-test-1",
			},
		);

		expect(execute).toHaveBeenCalledTimes(1);
	});

	it("wraps work in a transaction after setting the tenant RLS context", async () => {
		const execute = vi.fn().mockResolvedValue(undefined);
		const work = vi.fn(async () => "ok");

		mocks.transaction.mockImplementation(async (callback) =>
			callback({ execute }),
		);

		const result = await withTenantRlsTransaction(
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				userId: "usr-test-2",
			},
			work,
		);

		expect(mocks.transaction).toHaveBeenCalledTimes(1);
		expect(execute).toHaveBeenCalledTimes(1);
		expect(work).toHaveBeenCalledTimes(1);
		expect(result).toBe("ok");
	});

	it("supports company-only transactions when the caller does not yet have a user id", async () => {
		const execute = vi.fn().mockResolvedValue(undefined);
		const work = vi.fn(async () => "company-only");

		mocks.transaction.mockImplementation(async (callback) =>
			callback({ execute }),
		);

		const result = await withCompanyRlsTransaction(
			"00000000-0000-0000-0000-000000000002",
			work,
		);

		expect(mocks.transaction).toHaveBeenCalledTimes(1);
		expect(execute).toHaveBeenCalledTimes(1);
		expect(work).toHaveBeenCalledTimes(1);
		expect(result).toBe("company-only");
	});
});
