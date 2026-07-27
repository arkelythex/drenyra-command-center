/**
 * PrometeoService Contract Tests
 *
 * Validates the Prometeo API service contract: login, getAccounts, getMovements, logout.
 * Mocks the HTTP layer to avoid real API calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BankProvider } from "../../domain/types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const testProvider: BankProvider = "bcp_pers_pe";

describe("PrometeoService Contract", () => {
	let service: Awaited<ReturnType<typeof getService>>;

	async function getService() {
		process.env.PROMETEO_API_KEY = "test-api-key";
		process.env.PROMETEO_ENV = "sandbox";
		const { PrometeoService } = await import(
			"../../infrastructure/prometeo.service"
		);
		return new PrometeoService();
	}

	beforeEach(async () => {
		vi.clearAllMocks();
		service = await getService();

		// Default: successful response
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({ status: "success", key: "test-session" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ── Login ──────────────────────────────────────────────────────────────────

	describe("login", () => {
		it("returns session key string on valid credentials", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ status: "success", key: "session-xyz-789" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);

			const sessionKey = await service.login({
				provider: testProvider,
				username: "test-user",
				password: "test-pass",
			});

			expect(typeof sessionKey).toBe("string");
			expect(sessionKey).toBe("session-xyz-789");
		});

		it("throws on invalid credentials (401)", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ status: "error", message: "INVALID_CREDENTIALS" }),
					{ status: 401, headers: { "Content-Type": "application/json" } },
				),
			);

			await expect(
				service.login({
					provider: testProvider,
					username: "bad",
					password: "creds",
				}),
			).rejects.toThrow();
		});

		it("throws on network error", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				service.login({
					provider: testProvider,
					username: "test",
					password: "test",
				}),
			).rejects.toThrow();
		});
	});

	// ── getAccounts ────────────────────────────────────────────────────────────

	describe("getAccounts", () => {
		it("returns normalized account list", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						status: "success",
						accounts: [
							{
								id: "acc-1",
								number: "191-1234567890",
								name: "Cuenta Principal",
								branch: "0001",
								currency: "PEN",
								balance: 15000,
							},
							{
								id: "acc-2",
								number: "191-9876543210",
								name: "Cuenta Ahorros",
								branch: "0001",
								currency: "USD",
								balance: 5000,
							},
						],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);

			const accounts = await service.getAccounts("session-key", testProvider);

			expect(accounts).toHaveLength(2);
			expect(accounts[0].number).toBe("191-1234567890");
			expect(accounts[0].type).toBe("CHECKING");
			expect(accounts[1].currency).toBe("USD");
			expect(accounts[1].type).toBe("SAVINGS");
		});

		it("returns empty array when no accounts", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ status: "success", accounts: [] }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);

			const accounts = await service.getAccounts("session-key", testProvider);
			expect(accounts).toEqual([]);
		});
	});

	// ── getMovements ───────────────────────────────────────────────────────────

	describe("getMovements", () => {
		it("returns movements with credit/debit split", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						status: "success",
						movements: [
							{
								id: "mov-1",
								date: "2026-07-15",
								description: "DEPÓSITO",
								reference: "REF001",
								debit: null,
								credit: 1500,
								balance: 15000,
							},
							{
								id: "mov-2",
								date: "2026-07-16",
								description: "RETIRO",
								reference: "REF002",
								debit: 500,
								credit: null,
								balance: 14500,
							},
						],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);

			const movements = await service.getMovements(
				"session-key",
				testProvider,
				"acc-1",
				"2026-07-01",
				"2026-07-31",
			);

			expect(movements).toHaveLength(2);
			expect(movements[0].credit).toBe(1500);
			expect(movements[0].type).toBe("CREDIT");
			expect(movements[1].debit).toBe(500);
			expect(movements[1].type).toBe("DEBIT");
		});

		it("filters by date range", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						status: "success",
						movements: [{ id: "mov-1", date: "2026-07-15", description: "TEST", reference: "R1", debit: null, credit: 100, balance: 100 }],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);

			const movements = await service.getMovements(
				"session-key",
				testProvider,
				"acc-1",
				"2026-07-01",
				"2026-07-15",
			);

			// Verify date params are passed in URL
			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain("date_start=2026-07-01");
			expect(callUrl).toContain("date_end=2026-07-15");

			expect(movements).toHaveLength(1);
		});
	});

	// ── getPersonalInfo ────────────────────────────────────────────────────────

	describe("getPersonalInfo", () => {
		it("returns account holder info", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						status: "success",
						name: "JUAN PEREZ",
						document_type: "dni",
						document_number: "12345678",
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);

			const holder = await service.getPersonalInfo("session-key", testProvider);

			expect(holder.name).toBe("JUAN PEREZ");
			expect(holder.documentType).toBe("dni");
			expect(holder.documentNumber).toBe("12345678");
		});
	});

	// ── logout ─────────────────────────────────────────────────────────────────

	describe("logout", () => {
		it("completes without throwing with valid session", async () => {
			await expect(service.logout("session-key")).resolves.not.toThrow();
		});

		it("re-throws network errors (caller handles them)", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(service.logout("session-key")).rejects.toThrow("Network error");
		});
	});
});
