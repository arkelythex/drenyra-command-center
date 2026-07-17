import { describe, expect, it, vi } from "vitest";
import { CircuitBreakerOpenError } from "../src/base.connector";
import { ConnectorAuthError, ConnectorError } from "../src/errors";

function setupConnector(env: Record<string, string | undefined> = {}) {
	vi.stubEnv("DRENYRA_ERPNEXT_URL", env.url ?? "https://erp.example.com");
	vi.stubEnv("DRENYRA_ERPNEXT_API_KEY", env.apiKey ?? "test-api-key");
	vi.stubEnv("DRENYRA_ERPNEXT_API_SECRET", env.apiSecret ?? "test-api-secret");
	vi.stubEnv("DRENYRA_ERPNEXT_TIMEOUT_MS", env.timeoutMs ?? "10000");
}

async function createConnector(_env?: Record<string, string | undefined>) {
	const { ErpnextConnector } = await import(
		"../src/adapters/erpnext/erpnext.connector"
	);
	const c = new ErpnextConnector();
	await c.connect();
	return c;
}

describe("ErpnextConnector", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("connects and validates env vars", async () => {
		setupConnector();
		const c = await createConnector();
		expect(c.config.url).toBe("https://erp.example.com");
		expect(c.config.apiKey).toBe("test-api-key");
		expect(c.config.apiSecret).toBe("test-api-secret");
		expect(c.config.timeoutMs).toBe(10000);
	});

	it("applies default timeout when not provided", async () => {
		setupConnector({ timeoutMs: undefined });
		const c = await createConnector();
		expect(c.config.timeoutMs).toBe(10000);
	});

	it("health check returns status", async () => {
		setupConnector();
		const c = await createConnector();

		const health = await c.isHealthy();
		expect(health.connected).toBe(true);
		expect(health.status).toBe("healthy");
	});

	it("creates journal entry", async () => {
		setupConnector();
		const c = await createConnector();

		const mockResponse = {
			data: { name: "JE-2026-0001" },
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await c.execute<{ name: string }>({
			type: "journal_entry.create",
			data: {
				postingDate: "2026-06-01",
				company: "Drenyra SAC",
				accounts: [
					{
						account: "70 - Sales",
						debitInAccountCurrency: 0,
						creditInAccountCurrency: 1180,
					},
				],
				userRemark: "Test journal entry",
			},
		});

		expect(result.name).toBe("JE-2026-0001");
		expect(global.fetch).toHaveBeenCalledWith(
			"https://erp.example.com/api/method/frappe.client.insert",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "token test-api-key:test-api-secret",
					"Content-Type": "application/json",
				}),
				body: JSON.stringify({
					doctype: "Journal Entry",
					postingDate: "2026-06-01",
					company: "Drenyra SAC",
					accounts: [
						{
							account: "70 - Sales",
							debitInAccountCurrency: 0,
							creditInAccountCurrency: 1180,
						},
					],
					userRemark: "Test journal entry",
				}),
			}),
		);
	});

	it("creates a party", async () => {
		setupConnector();
		const c = await createConnector();

		const mockResponse = {
			data: { name: "CUS-2026-0001" },
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await c.execute<{ name: string }>({
			type: "party.create",
			data: {
				partyType: "Customer",
				partyName: "Acme Corp",
				taxId: "20123456789",
				company: "Drenyra SAC",
				email: "facturacion@acme.com",
			},
		});

		expect(result.name).toBe("CUS-2026-0001");
		expect(global.fetch).toHaveBeenCalledWith(
			"https://erp.example.com/api/method/frappe.client.insert",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					doctype: "Customer",
					customer_name: "Acme Corp",
					supplier_name: "Acme Corp",
					tax_id: "20123456789",
					company: "Drenyra SAC",
					email: "facturacion@acme.com",
				}),
			}),
		);
	});

	it("gets a party", async () => {
		setupConnector();
		const c = await createConnector();

		const mockResponse = {
			data: {
				name: "CUS-2026-0001",
				customer_name: "Acme Corp",
				tax_id: "20123456789",
			},
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await c.execute<Record<string, unknown>>({
			type: "party.get",
			name: "CUS-2026-0001",
		});

		expect(result.customer_name).toBe("Acme Corp");
		expect(result.tax_id).toBe("20123456789");
		expect(global.fetch).toHaveBeenCalledWith(
			"https://erp.example.com/api/method/frappe.client.get",
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({
					Authorization: "token test-api-key:test-api-secret",
				}),
				body: JSON.stringify({
					doctype: "Customer",
					name: "CUS-2026-0001",
				}),
			}),
		);
	});

	it("auth error on 401", async () => {
		setupConnector();
		const c = await createConnector();

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			statusText: "Unauthorized",
		});

		await expect(
			c.execute({
				type: "journal_entry.create",
				data: {
					postingDate: "2026-06-01",
					company: "Drenyra SAC",
					accounts: [],
				},
			}),
		).rejects.toThrow(ConnectorAuthError);
	});

	it("circuit breaker trips on repeated failures", async () => {
		setupConnector();
		const c = await createConnector();

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		});

		for (let i = 0; i < 4; i++) {
			await expect(
				c.execute({
					type: "journal_entry.create",
					data: {
						postingDate: "2026-06-01",
						company: "Drenyra SAC",
						accounts: [],
					},
				}),
			).rejects.toThrow(ConnectorError);
		}

		await expect(
			c.execute({
				type: "journal_entry.create",
				data: {
					postingDate: "2026-06-01",
					company: "Drenyra SAC",
					accounts: [],
				},
			}),
		).rejects.toThrow(CircuitBreakerOpenError);
	});

	it("lists journal entries with filters", async () => {
		setupConnector();
		const c = await createConnector();

		const mockResponse = {
			data: [{ name: "JE-2026-0001" }, { name: "JE-2026-0002" }],
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await c.execute<Array<{ name: string }>>({
			type: "journal_entry.list",
			filters: {
				company: "Drenyra SAC",
				posting_date: [">=", "2026-06-01"],
			},
		});

		expect(result).toHaveLength(2);
		expect(result[0].name).toBe("JE-2026-0001");
		expect(global.fetch).toHaveBeenCalledWith(
			"https://erp.example.com/api/method/frappe.client.get_list",
			expect.objectContaining({
				method: "GET",
				body: JSON.stringify({
					doctype: "Journal Entry",
					filters: {
						company: "Drenyra SAC",
						posting_date: [">=", "2026-06-01"],
					},
				}),
			}),
		);
	});
});
