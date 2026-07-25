import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { dbInsert, dbValues } = vi.hoisted(() => {
	const insert = vi.fn();
	const values = vi.fn(() => ({ returning: vi.fn() }));
	insert.mockReturnValue({ values });
	return { dbInsert: insert, dbValues: values };
});

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		insert: dbInsert,
	},
}));

import { oauthAuditHooks } from "../../lib/oauth-audit-hooks";

describe("oauthAuditHooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dbInsert.mockReturnValue({ values: dbValues });
	});

	describe("account.create.after", () => {
		it("inserts an audit log row on OAuth account creation", async () => {
			const hook = oauthAuditHooks.account.create.after;
			const account = {
				id: "acc-1",
				userId: "user-1",
				providerId: "google",
				accountId: "google-oid-12345",
			};

			await hook(account);

			expect(dbInsert).toHaveBeenCalled();
			const valuesArg = dbValues.mock.calls[0]?.[0];
			expect(valuesArg).toBeDefined();
			expect(valuesArg.userId).toBe("user-1");
			expect(valuesArg.action).toBe("login_oauth");
			expect(valuesArg.details).toEqual({ providerId: "google" });
			expect(valuesArg.ipAddress).toBeUndefined();
			expect(valuesArg.userAgent).toBeUndefined();
			expect(valuesArg.timestamp).toBeInstanceOf(Date);
		});

		it("handles github provider correctly in audit log", async () => {
			const hook = oauthAuditHooks.account.create.after;
			const account = {
				id: "acc-2",
				userId: "user-2",
				providerId: "github",
				accountId: "github-oid-67890",
			};

			await hook(account);

			const valuesArg = dbValues.mock.calls[0]?.[0];
			expect(valuesArg.action).toBe("login_oauth");
			expect(valuesArg.details).toEqual({ providerId: "github" });
		});

		it("does not insert an audit log when userId is missing", async () => {
			const hook = oauthAuditHooks.account.create.after;
			const account = {
				id: "acc-3",
				userId: "",
				providerId: "google",
				accountId: "google-oid-99999",
			};

			await hook(account);

			expect(dbInsert).not.toHaveBeenCalled();
		});
	});
});
