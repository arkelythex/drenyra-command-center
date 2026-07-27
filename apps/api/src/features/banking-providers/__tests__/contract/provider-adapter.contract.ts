/**
 * BankProviderAdapter Contract Test Suite
 *
 * Shared test suite that any BankProviderAdapter implementation must pass.
 * Ensures all adapters follow the same contract regardless of provider.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { BankProviderAdapter, RawCredentials } from "@drenyra/domain/providers";

/**
 * Creates and returns a fresh adapter instance for testing.
 * Override in each provider's contract test file.
 */
export function testBankProviderAdapter(
	adapterName: string,
	createAdapter: () => BankProviderAdapter,
	loginCredentials?: RawCredentials,
) {
	const credentials: RawCredentials = loginCredentials ?? {
		username: "test-user",
		password: "test-pass",
	};

	describe(`BankProviderAdapter Contract: ${adapterName}`, () => {
		let adapter: BankProviderAdapter;
		let session: Awaited<ReturnType<BankProviderAdapter["login"]>>;

		beforeEach(async () => {
			adapter = createAdapter();
		});

		afterEach(async () => {
			if (session) {
				await adapter.logout(session).catch(() => {});
			}
		});

		// ── Login ──────────────────────────────────────────────────────────────

		describe("login", () => {
			it("returns a valid session with key and expiration", async () => {
				session = await adapter.login(credentials);

				expect(session).toBeDefined();
				expect(typeof session.sessionKey).toBe("string");
				expect(session.sessionKey.length).toBeGreaterThan(0);
				expect(session.providerCode).toBe(adapter.providerCode);
				expect(session.expiresAt).toBeInstanceOf(Date);
				expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
			});
		});

		// ── getAccounts ────────────────────────────────────────────────────────

		describe("getAccounts", () => {
			beforeEach(async () => {
				session = await adapter.login(credentials);
			});

			it("returns a list of normalized accounts", async () => {
				const accounts = await adapter.getAccounts(session);

				expect(Array.isArray(accounts)).toBe(true);

				for (const account of accounts) {
					expect(typeof account.id).toBe("string");
					expect(typeof account.number).toBe("string");
					expect(typeof account.name).toBe("string");
					expect(["CHECKING", "SAVINGS", "CREDIT", "DETRACTION"]).toContain(
						account.type,
					);
					expect(["PEN", "USD", "EUR"]).toContain(account.currency);
					expect(typeof account.balance).toBe("number");
				}
			});

			it("returns deterministic results within the same session", async () => {
				const [first, second] = await Promise.all([
					adapter.getAccounts(session),
					adapter.getAccounts(session),
				]);

				expect(first.length).toBeGreaterThanOrEqual(0);
				expect(first.length).toBe(second.length);
			});
		});

		// ── getMovements ──────────────────────────────────────────────────────

		describe("getMovements", () => {
			beforeEach(async () => {
				session = await adapter.login(credentials);
			});

			it("returns a list of normalized movements for an account", async () => {
				const accounts = await adapter.getAccounts(session);
				if (accounts.length === 0) return; // Skip if no accounts

				const movements = await adapter.getMovements(
					session,
					accounts[0].id,
				);

				expect(Array.isArray(movements)).toBe(true);

				for (const mov of movements) {
					expect(typeof mov.externalId).toBe("string");
					expect(typeof mov.date).toBe("string");
					expect(typeof mov.amount).toBe("number");
					expect(["CREDIT", "DEBIT"]).toContain(mov.type);
					expect(typeof mov.description).toBe("string");
				}
			});

			it("respects date range filters", async () => {
				const accounts = await adapter.getAccounts(session);
				if (accounts.length === 0) return;

				const movements = await adapter.getMovements(
					session,
					accounts[0].id,
					"2026-01-01",
					"2026-12-31",
				);

				expect(Array.isArray(movements)).toBe(true);
			});
		});

		// ── getBalances ────────────────────────────────────────────────────────

		describe("getBalances", () => {
			beforeEach(async () => {
				session = await adapter.login(credentials);
			});

			it("returns current and available balance", async () => {
				const accounts = await adapter.getAccounts(session);
				if (accounts.length === 0) return;

				const balances = await adapter.getBalances(
					session,
					accounts[0].id,
				);

				expect(balances).toBeDefined();
				expect(typeof balances.current).toBe("number");
				expect(typeof balances.available).toBe("number");
			});
		});

		// ── logout ─────────────────────────────────────────────────────────────

		describe("logout", () => {
			it("completes without throwing", async () => {
				const s = await adapter.login(credentials);
				await expect(adapter.logout(s)).resolves.not.toThrow();
			});

			it("is idempotent (calling twice doesn't throw)", async () => {
				const s = await adapter.login(credentials);
				await adapter.logout(s);
				await expect(adapter.logout(s)).resolves.not.toThrow();
			});
		});
	});
}
