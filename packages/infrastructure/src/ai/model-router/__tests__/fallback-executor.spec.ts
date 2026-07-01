import { describe, expect, it, mock } from "bun:test";
import type { ModelCapability } from "@arkelythex/domain/ai/model-router/types";
import type { RoutingAuditLogRepository } from "@arkelythex/domain/repositories/model-registration.repository";
import { FallbackExecutor } from "../fallback-executor";
import type {
	ProviderAdapter,
	ProviderResponse,
} from "../provider-adapter.types";

function makeAdapter(
	name: string,
	response?: Partial<ProviderResponse>,
	shouldThrow?: boolean,
): ProviderAdapter {
	const defaultResponse: ProviderResponse = {
		content: `response from ${name}`,
		modelName: name,
		latencyMs: 500,
		inputTokens: 100,
		outputTokens: 50,
		costCents: 2,
		...response,
	};
	return {
		providerName: "openai",
		modelName: name,
		sendRequest: mock(() =>
			shouldThrow
				? Promise.reject(new Error(`${name} failed`))
				: Promise.resolve(defaultResponse),
		),
		validateResponse: mock(() => true),
		checkHealth: mock(() =>
			Promise.resolve({
				status: "healthy" as const,
				latencyMs: 100,
				errorRate: 0,
				lastCheckedAt: new Date(),
			}),
		),
		getCost: mock((input: number, output: number) => input + output),
	};
}

function mockAuditRepo(): RoutingAuditLogRepository {
	return {
		save: mock(() => Promise.resolve()),
		findByRequestId: mock(() => Promise.resolve([])),
		findByCapability: mock(() => Promise.resolve([])),
	};
}

describe("FallbackExecutor", () => {
	it("returns successful result from primary adapter", async () => {
		const primary = makeAdapter("gpt-4o");
		const executor = new FallbackExecutor(mockAuditRepo());

		const result = await executor.executeWithFallback(
			"req-1",
			"CHAT",
			primary,
			[],
			"Hello",
		);

		expect(result.success).toBe(true);
		expect(result.selectedModelId).toBe("gpt-4o");
		expect(result.fallbackAttempted).toBe(false);
		expect(result.attemptNumber).toBe(1);
	});

	it("falls back to next adapter when primary fails", async () => {
		const primary = makeAdapter("gpt-4o", undefined, true);
		const fallback = makeAdapter("claude-3.5");
		const executor = new FallbackExecutor(mockAuditRepo());

		const result = await executor.executeWithFallback(
			"req-2",
			"CLASSIFICATION",
			primary,
			[fallback],
			"Classify this",
		);

		expect(result.success).toBe(true);
		expect(result.selectedModelId).toBe("claude-3.5");
		expect(result.fallbackAttempted).toBe(true);
	});

	it("returns failure when all providers fail", async () => {
		const primary = makeAdapter("gpt-4o", undefined, true);
		const executor = new FallbackExecutor(mockAuditRepo(), {
			maxRetries: 2,
			retryDelayMs: 0,
			qualityGates: [],
		});

		const result = await executor.executeWithFallback(
			"req-3",
			"EXTRACTION",
			primary,
			[],
			"Extract data",
		);

		expect(result.success).toBe(false);
		expect(result.errorMessage).toBe("gpt-4o failed");
	});

	it("limits attempts to maxRetries", async () => {
		const primary = makeAdapter("gpt-4o", undefined, true);
		const fallback1 = makeAdapter("claude-3.5", undefined, true);
		const fallback2 = makeAdapter("gemini-2", undefined, true);
		const executor = new FallbackExecutor(mockAuditRepo(), {
			maxRetries: 2,
			retryDelayMs: 0,
			qualityGates: [],
		});

		const result = await executor.executeWithFallback(
			"req-4",
			"ANALYSIS",
			primary,
			[fallback1, fallback2],
			"Analyze",
		);

		expect(result.success).toBe(false);
		expect(primary.sendRequest).toHaveBeenCalledTimes(1);
		expect(fallback1.sendRequest).toHaveBeenCalledTimes(1);
		expect(fallback2.sendRequest).not.toHaveBeenCalled();
	});

	it("audits the attempt on failure before returning", async () => {
		const auditRepo = mockAuditRepo();
		const primary = makeAdapter("gpt-4o", undefined, true);
		const executor = new FallbackExecutor(auditRepo, {
			maxRetries: 2,
			retryDelayMs: 0,
			qualityGates: [],
		});

		await executor.executeWithFallback("req-5", "CHAT", primary, [], "Hi");

		expect(auditRepo.save).toHaveBeenCalledTimes(1);
	});
});
