/**
 * CANONICAL EXAMPLE — API Route Test
 *
 * Demonstrates recommended patterns for testing ElysiaJS API endpoints
 * using the Eden Treaty test client pattern.
 *
 * Key patterns shown:
 * 1. Elysia app creation with test handlers
 * 2. Request/Response testing via Eden Treaty
 * 3. Auth header setup
 * 4. Tenant scoping
 *
 * @last-verified: 2026-06-06
 */

import { Elysia } from "elysia";
import { beforeAll, describe, expect, it } from "vitest";
import {
	assertClientError,
	assertStatus,
	assertSuccess,
	createAuthHeaders,
	createEdenTestClient,
	createTenantRequestHeaders,
} from "../../src/api";

// Shared test app for all API tests
let app: Elysia;

// ============================================================
// SETUP: Test Elysia Application
// ============================================================

beforeAll(() => {
	app = new Elysia()
		// --- Journal Entry routes ---
		.get("/api/v1/journal-entries/:id", ({ params: { id }, headers }) => {
			// Simulate auth check
			if (!headers.authorization) {
				return new Response(
					JSON.stringify({ code: "UNAUTHORIZED", message: "No auth token" }),
					{ status: 401, headers: { "Content-Type": "application/json" } },
				);
			}

			// Simulate tenant scoping
			const tenantId = headers["x-tenant-id"];
			if (!tenantId) {
				return new Response(
					JSON.stringify({
						code: "TENANT_REQUIRED",
						message: "Tenant ID required",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			if (id === "je_001") {
				return new Response(
					JSON.stringify({
						id: "je_001",
						organizationId: Number(tenantId),
						gloss: "Asiento de venta",
						status: "borrador",
						totalDebit: 1000,
						totalCredit: 1000,
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			}

			return new Response(
				JSON.stringify({
					code: "NOT_FOUND",
					message: "Journal entry not found",
				}),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		})
		.post("/api/v1/journal-entries", ({ body, headers }) => {
			if (!headers.authorization) {
				return new Response(
					JSON.stringify({ code: "UNAUTHORIZED", message: "No auth token" }),
					{ status: 401, headers: { "Content-Type": "application/json" } },
				);
			}

			return new Response(
				JSON.stringify({
					id: "je_new_001",
					...(body as Record<string, unknown>),
					status: "borrador",
				}),
				{ status: 201, headers: { "Content-Type": "application/json" } },
			);
		});
});

// ============================================================
// 1. EDEN TREATY CLIENT — REQUEST/RESPONSE TESTING
// ============================================================

describe("Journal Entry API — Eden Treaty Client", () => {
	const client = () => createEdenTestClient(app);

	it("fetches a journal entry by ID with auth", async () => {
		const response = await client().request("/api/v1/journal-entries/je_001", {
			method: "GET",
			headers: createAuthHeaders({
				token: "test-token-123",
				tenantId: "1",
			}),
		});

		assertSuccess(response);
		expect(response.status).toBe(200);
	});

	it("fetches existing journal entry", async () => {
		const response = await client().request("/api/v1/journal-entries/je_001", {
			method: "GET",
			headers: createTenantRequestHeaders({
				token: "test-token-123",
				tenantId: "1",
				ruc: "20546296564",
			}),
		});

		expect(response.status).toBe(200);
		expect(response.data).toEqual(
			expect.objectContaining({
				id: "je_001",
				gloss: "Asiento de venta",
				status: "borrador",
			}),
		);
	});

	it("creates a new journal entry", async () => {
		const response = await client().request("/api/v1/journal-entries", {
			method: "POST",
			headers: createAuthHeaders({
				token: "test-token-123",
				tenantId: "1",
			}),
			body: {
				gloss: "Nuevo asiento",
				lines: [
					{ accountCode: "1041", amount: 1000, type: "debit" },
					{ accountCode: "7011", amount: 1000, type: "credit" },
				],
			},
		});

		assertStatus(response, 201);
		expect(response.data).toEqual(
			expect.objectContaining({
				gloss: "Nuevo asiento",
				status: "borrador",
			}),
		);
	});
});

// ============================================================
// 2. AUTH HEADER SETUP
// ============================================================

describe("Auth Header Setup", () => {
	it("creates proper auth headers", () => {
		const headers = createAuthHeaders({
			token: "test-token-456",
			tenantId: "2",
		});

		expect(headers).toEqual({
			Authorization: "Bearer test-token-456",
			"Content-Type": "application/json",
			"x-tenant-id": "2",
		});
	});

	it("creates tenant-scoped request headers", () => {
		const headers = createTenantRequestHeaders({
			token: "test-token-789",
			tenantId: "3",
			ruc: "20601234573",
		});

		expect(headers).toEqual({
			Authorization: "Bearer test-token-789",
			"Content-Type": "application/json",
			"x-tenant-id": "3",
			"x-tenant-ruc": "20601234573",
		});
	});
});

// ============================================================
// 3. TENANT SCOPING
// ============================================================

describe("Tenant Scoping", () => {
	it("requires tenant ID header", async () => {
		const response = await createEdenTestClient(app).request(
			"/api/v1/journal-entries/je_001",
			{
				method: "GET",
				headers: {
					Authorization: "Bearer test-token",
				},
			},
		);

		assertClientError(response);
		expect(response.status).toBe(400);
	});

	it("rejects requests without auth token", async () => {
		const response = await createEdenTestClient(app).request(
			"/api/v1/journal-entries/je_001",
			{ method: "GET" },
		);

		assertClientError(response);
		expect(response.status).toBe(401);
	});
});
