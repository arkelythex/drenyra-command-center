import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelect, dbFrom, dbWhere, dbDelete, dbUpdate, dbSet } = vi.hoisted(() => {
	const select = vi.fn();
	const from = vi.fn(() => ({ where: vi.fn() }));
	const where = vi.fn();
	const del = vi.fn(() => ({ where: vi.fn() }));
	const update = vi.fn(() => ({ set: vi.fn() }));
	const set = vi.fn(() => ({ where: vi.fn() }));
	select.mockReturnValue({ from });
	return { dbSelect: select, dbFrom: from, dbWhere: where, dbDelete: del, dbUpdate: update, dbSet: set };
});

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: dbSelect,
		delete: dbDelete,
		update: dbUpdate,
	},
}));

vi.mock("@drenyra/persistence/schema", () => ({
	authAccounts: { id: "auth_accounts" },
}));

import { unlinkProvider } from "../../lib/unlink-provider";

describe("unlinkProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dbSelect.mockReturnValue({ from: dbFrom });
		dbDelete.mockReturnValue({ where: dbWhere });
		dbUpdate.mockReturnValue({ set: dbSet });
	});

	describe("rejects unlinking the only sign-in method", () => {
		it("throws when user has exactly one account", async () => {
			const mockWhere = vi.fn().mockResolvedValue([
				{
					id: "acc-1",
					userId: "user-1",
					providerId: "google",
					isPrimary: true,
				},
			]);
			dbFrom.mockReturnValue({ where: mockWhere });

			await expect(
				unlinkProvider({ userId: "user-1", providerId: "google" }),
			).rejects.toThrow("Cannot unlink your only sign-in method");
		});
	});

	describe("non-primary account unlinking", () => {
		it("deletes the account and does not promote when unlinking a non-primary account", async () => {
			const mockWhere = vi.fn().mockResolvedValue([
				{
					id: "acc-1",
					userId: "user-1",
					providerId: "credential",
					isPrimary: true,
				},
				{
					id: "acc-2",
					userId: "user-1",
					providerId: "google",
					isPrimary: false,
				},
			]);
			dbFrom.mockReturnValue({ where: mockWhere });

			const result = await unlinkProvider({
				userId: "user-1",
				providerId: "google",
			});

			expect(result.success).toBe(true);
			expect(dbDelete).toHaveBeenCalled();
			expect(dbUpdate).not.toHaveBeenCalled();
		});
	});

	describe("primary account unlinking with promotion", () => {
		it("deletes the primary account and promotes the next available account", async () => {
			const mockWhere = vi.fn().mockResolvedValue([
				{
					id: "acc-1",
					userId: "user-1",
					providerId: "google",
					isPrimary: true,
				},
				{
					id: "acc-2",
					userId: "user-1",
					providerId: "github",
					isPrimary: false,
				},
			]);
			dbFrom.mockReturnValue({ where: mockWhere });
			dbSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

			const result = await unlinkProvider({
				userId: "user-1",
				providerId: "google",
			});

			expect(result.success).toBe(true);
			expect(dbDelete).toHaveBeenCalled();
			expect(dbUpdate).toHaveBeenCalled();
			const updateCall = dbUpdate.mock.calls[0]?.[0];
			expect(updateCall).toBeDefined();
		});
	});

	describe("edge cases", () => {
		it("throws when the target provider is not linked", async () => {
			const mockWhere = vi.fn().mockResolvedValue([
				{
					id: "acc-1",
					userId: "user-1",
					providerId: "credential",
					isPrimary: true,
				},
				{
					id: "acc-2",
					userId: "user-1",
					providerId: "github",
					isPrimary: false,
				},
			]);
			dbFrom.mockReturnValue({ where: mockWhere });

			await expect(
				unlinkProvider({ userId: "user-1", providerId: "google" }),
			).rejects.toThrow("Provider not linked to this account");
		});

		it("throws when user has no accounts at all", async () => {
			const mockWhere = vi.fn().mockResolvedValue([]);
			dbFrom.mockReturnValue({ where: mockWhere });

			await expect(
				unlinkProvider({ userId: "user-1", providerId: "google" }),
			).rejects.toThrow("Cannot unlink your only sign-in method");
		});
	});
});
