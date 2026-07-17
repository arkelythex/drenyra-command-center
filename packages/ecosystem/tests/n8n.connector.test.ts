import { describe, expect, it, vi } from "vitest";
import { CircuitBreakerOpenError } from "../src/base.connector";
import { ConnectorAuthError, ConnectorError } from "../src/errors";

// We test the N8nConnector via a controlled subclass that mocks fetch
function setupConnector(env: Record<string, string | undefined> = {}) {
	vi.stubEnv("DRENYRA_N8N_ENDPOINT", env.endpoint ?? "http://n8n:5678");
	vi.stubEnv("DRENYRA_N8N_API_KEY", env.apiKey ?? "test-api-key");
	vi.stubEnv("DRENYRA_N8N_TIMEOUT_MS", env.timeoutMs ?? "5000");
	vi.stubEnv("DRENYRA_N8N_WEBHOOK_PREFIX", env.webhookPrefix ?? "/webhook/");
}

async function createConnector(_env?: Record<string, string | undefined>) {
	const { N8nConnector } = await import("../src/adapters/n8n/n8n.connector");
	const c = new N8nConnector();
	await c.connect();
	return c;
}

describe("N8nConnector", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("connects and validates env vars", async () => {
		setupConnector();
		const c = await createConnector();
		expect(c.config.endpoint).toBe("http://n8n:5678");
		expect(c.config.apiKey).toBe("test-api-key");
		expect(c.config.timeoutMs).toBe(5000);
		expect(c.config.webhookPrefix).toBe("/webhook/");
	});

	it("applies default endpoint when not provided", async () => {
		setupConnector({ endpoint: undefined });
		const c = await createConnector({ apiKey: "key", timeoutMs: "5000" });
		expect(c.config.endpoint).toBe("http://n8n:5678");
	});

	it("health check returns status", async () => {
		setupConnector();
		const c = await createConnector();

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
		});

		const health = await c.isHealthy();
		expect(health.connected).toBe(true);
		expect(health.status).toBe("healthy");
	});

	it("triggers workflow with correct webhook URL", async () => {
		setupConnector({ webhookPrefix: "/webhook-hook/" });
		const c = await createConnector();

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			headers: new Map([["x-execution-id", "exec-123"]]),
		});

		const result = await c.execute<{ executionId: string }>({
			type: "workflow.trigger",
			workflowId: "wf-1",
			payload: { invoiceId: "inv-001" },
		});

		expect(result.executionId).toBe("exec-123");
		expect(global.fetch).toHaveBeenCalledWith(
			"http://n8n:5678/webhook-hook/wf-1",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ invoiceId: "inv-001" }),
			}),
		);
	});

	it("auth error on invalid API key", async () => {
		setupConnector();
		const c = await createConnector();

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			statusText: "Unauthorized",
		});

		await expect(c.execute({ type: "workflow.list" })).rejects.toThrow(
			ConnectorAuthError,
		);
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
			await expect(c.execute({ type: "workflow.list" })).rejects.toThrow(
				ConnectorError,
			);
		}

		// Circuit opens after auto-retry accelerates failure accumulation
		for (let i = 0; i < 5; i++) {
			await expect(c.execute({ type: "workflow.list" })).rejects.toThrow(
				CircuitBreakerOpenError,
			);
		}

		await expect(c.execute({ type: "workflow.list" })).rejects.toThrow(
			CircuitBreakerOpenError,
		);
	});

	it("gets execution status via REST API", async () => {
		setupConnector();
		const c = await createConnector();

		const mockStatus = {
			id: "exec-123",
			workflowId: "wf-1",
			status: "success" as const,
			startedAt: "2026-01-01T00:00:00Z",
			finishedAt: "2026-01-01T00:00:05Z",
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: mockStatus }),
		});

		const result = await c.execute({
			type: "workflow.status",
			executionId: "exec-123",
		});

		expect(result).toEqual(mockStatus);
		expect(global.fetch).toHaveBeenCalledWith(
			"http://n8n:5678/rest/executions/exec-123",
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({
					Authorization: "Bearer test-api-key",
				}),
			}),
		);
	});
});
