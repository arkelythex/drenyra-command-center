import { describe, expect, it, vi } from "vitest";
import type {
	DifyChatResponse,
	DifyKnowledgeRetrievalResponse,
	DifyWorkflowRunResponse,
} from "../src/adapters/dify";
import { CircuitBreakerOpenError } from "../src/base.connector";
import { ConnectorAuthError, ConnectorError } from "../src/errors";

function setupConnector(env: Record<string, string | undefined> = {}) {
	vi.stubEnv("DRENYRA_DIFY_ENDPOINT", env.endpoint ?? "http://dify:5000");
	vi.stubEnv("DRENYRA_DIFY_API_KEY", env.apiKey ?? "test-api-key");
	vi.stubEnv("DRENYRA_DIFY_TIMEOUT_MS", env.timeoutMs ?? "5000");
}

async function createConnector(_env?: Record<string, string | undefined>) {
	const { DifyConnector } = await import("../src/adapters/dify/dify.connector");
	const c = new DifyConnector();
	await c.connect();
	return c;
}

describe("DifyConnector", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("connects and validates env vars", async () => {
		setupConnector();
		const c = await createConnector();
		expect(c.config.endpoint).toBe("http://dify:5000");
		expect(c.config.apiKey).toBe("test-api-key");
		expect(c.config.timeoutMs).toBe(5000);
	});

	it("applies default endpoint when not provided", async () => {
		setupConnector({ endpoint: undefined });
		const c = await createConnector({ apiKey: "key", timeoutMs: "5000" });
		expect(c.config.endpoint).toBe("http://dify:5000");
	});

	it("health check returns status", async () => {
		setupConnector();
		const c = await createConnector();

		global.fetch = vi.fn().mockResolvedValue({ ok: true });

		const health = await c.isHealthy();
		expect(health.connected).toBe(true);
		expect(health.status).toBe("healthy");
	});

	it("chat.message posts to correct URL", async () => {
		setupConnector();
		const c = await createConnector();

		const mockResponse: DifyChatResponse = {
			answer: "Hello!",
			conversation_id: "conv-123",
			message_id: "msg-1",
			created_at: 1700000000,
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await c.execute<DifyChatResponse>({
			type: "chat.message",
			query: "Hello Dify",
		});

		expect(result.answer).toBe("Hello!");
		expect(result.conversation_id).toBe("conv-123");
		expect(global.fetch).toHaveBeenCalledWith(
			"http://dify:5000/v1/chat-messages",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer test-api-key",
					"Content-Type": "application/json",
				}),
				body: JSON.stringify({
					query: "Hello Dify",
					user: "drenyra",
					response_mode: "blocking",
				}),
			}),
		);
	});

	it("workflow.run sends correct payload", async () => {
		setupConnector();
		const c = await createConnector();

		const mockResponse: DifyWorkflowRunResponse = {
			id: "run-1",
			workflow_id: "wf-1",
			status: "succeeded",
			inputs: { invoiceId: "inv-001" },
			outputs: { result: "ok" },
			error: null,
			elapsed_time: 1500,
			created_at: 1700000000,
			finished_at: 1700001500,
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await c.execute<DifyWorkflowRunResponse>({
			type: "workflow.run",
			workflowId: "wf-1",
			inputs: { invoiceId: "inv-001" },
		});

		expect(result.status).toBe("succeeded");
		expect(result.id).toBe("run-1");
		expect(global.fetch).toHaveBeenCalledWith(
			"http://dify:5000/v1/workflows/run",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					inputs: { invoiceId: "inv-001" },
					user: "drenyra",
					response_mode: "blocking",
				}),
			}),
		);
	});

	it("knowledge.retrieve queries dataset", async () => {
		setupConnector();
		const c = await createConnector();

		const mockResponse: DifyKnowledgeRetrievalResponse = {
			records: [
				{
					segment_id: "seg-1",
					content: "Relevant document chunk",
					score: 0.95,
					dataset_id: "ds-1",
					document_id: "doc-1",
				},
			],
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await c.execute<DifyKnowledgeRetrievalResponse>({
			type: "knowledge.retrieve",
			query: "tax rules",
			datasetId: "ds-1",
			topK: 5,
		});

		expect(result.records).toHaveLength(1);
		expect(result.records[0].content).toBe("Relevant document chunk");
		expect(global.fetch).toHaveBeenCalledWith(
			"http://dify:5000/v1/datasets/ds-1/retrieve",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ query: "tax rules", top_k: 5 }),
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

		await expect(
			c.execute({ type: "chat.message", query: "test" }),
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
				c.execute({ type: "chat.message", query: "test" }),
			).rejects.toThrow(ConnectorError);
		}

		// Circuit opens earlier due to auto-retry doubling failure count
		for (let i = 0; i < 5; i++) {
			await expect(
				c.execute({ type: "chat.message", query: "test" }),
			).rejects.toThrow(CircuitBreakerOpenError);
		}
	});

	it("gets workflow status via API", async () => {
		setupConnector();
		const c = await createConnector();

		const mockStatus: DifyWorkflowRunResponse = {
			id: "run-123",
			workflow_id: "wf-1",
			status: "running",
			inputs: {},
			outputs: null,
			error: null,
			elapsed_time: 500,
			created_at: 1700000000,
			finished_at: 0,
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockStatus),
		});

		const result = await c.execute<DifyWorkflowRunResponse>({
			type: "workflow.status",
			runId: "run-123",
		});

		expect(result.status).toBe("running");
		expect(result.id).toBe("run-123");
		expect(global.fetch).toHaveBeenCalledWith(
			"http://dify:5000/v1/workflows/run/run-123",
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({
					Authorization: "Bearer test-api-key",
				}),
			}),
		);
	});
});
