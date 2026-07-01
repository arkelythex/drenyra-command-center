import { describe, expect, it, mock } from "bun:test";
import type {
	CapabilityRoutingRule,
	ModelCapability,
	ModelRegistration,
} from "@arkelythex/domain/ai/model-router/types";
import type {
	CapabilityRoutingRuleRepository,
	ModelRegistrationRepository,
	RoutingAuditLogRepository,
} from "@arkelythex/domain/repositories/model-registration.repository";
import type {
	ProviderAdapter,
	ProviderAdapterFactory,
} from "../provider-adapter.types";
import { ModelRegistryService } from "../registry";
import { AdaptiveRouter } from "../router";

function makeModel(
	id: string,
	capabilities: ModelCapability[],
	overrides: Partial<ModelRegistration> = {},
): ModelRegistration {
	return {
		id,
		providerName: "openai",
		modelName: id,
		displayName: id,
		capabilities,
		status: "ACTIVE",
		priority: 1,
		costPer1KInput: 0.01,
		costPer1KOutput: 0.03,
		maxTokens: 128_000,
		avgLatencyMs: 1000,
		reliability: 0.95,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function mockAdapterFactory(): ProviderAdapterFactory {
	return {
		createAdapter: mock(
			(modelId: string, modelName: string): ProviderAdapter => ({
				providerName: "openai",
				modelName,
				sendRequest: mock(() =>
					Promise.resolve({
						content: `response from ${modelName}`,
						modelName,
						latencyMs: 500,
						inputTokens: 100,
						outputTokens: 50,
						costCents: 2,
					}),
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
			}),
		),
	};
}

function mockModelRepo(
	models: ModelRegistration[] = [],
): ModelRegistrationRepository {
	return {
		save: mock((m: ModelRegistration) => Promise.resolve(m)),
		update: mock((m: ModelRegistration) => Promise.resolve(m)),
		findById: mock((id: string) =>
			Promise.resolve(models.find((m) => m.id === id) ?? null),
		),
		findAll: mock(() => Promise.resolve(models)),
		findByCapability: mock((cap: ModelCapability) =>
			Promise.resolve(models.filter((m) => m.capabilities.includes(cap))),
		),
		findOptimalForCapability: mock(() => Promise.resolve(null)),
		delete: mock(() => Promise.resolve()),
	};
}

function mockRoutingRepo(
	rules: CapabilityRoutingRule[] = [],
): CapabilityRoutingRuleRepository {
	return {
		save: mock((r: CapabilityRoutingRule) => Promise.resolve(r)),
		findByCapability: mock((cap: ModelCapability) =>
			Promise.resolve(rules.find((r) => r.capability === cap) ?? null),
		),
		findAll: mock(() => Promise.resolve(rules)),
		delete: mock(() => Promise.resolve()),
	};
}

function mockAuditRepo(): RoutingAuditLogRepository {
	return {
		save: mock(() => Promise.resolve()),
		findByRequestId: mock(() => Promise.resolve([])),
		findByCapability: mock(() => Promise.resolve([])),
	};
}

describe("AdaptiveRouter", () => {
	it("routes using capability_match strategy by default", async () => {
		const models = [makeModel("gpt-4o", ["CHAT"])];
		const registry = new ModelRegistryService(
			mockModelRepo(models),
			mockRoutingRepo(),
		);
		const router = new AdaptiveRouter(
			registry,
			mockRoutingRepo(),
			mockAuditRepo(),
			mockAdapterFactory(),
			{ auditEnabled: true, defaultQualityGates: [] },
		);

		const result = await router.route("req-1", "CHAT", "Hello");

		expect(result.success).toBe(true);
		expect(result.strategy).toBe("capability_match");
	});

	it("routes using cost_optimal strategy when rule specifies it", async () => {
		const models = [
			makeModel("gpt-4o", ["CHAT"], {
				costPer1KInput: 0.05,
				costPer1KOutput: 0.15,
			}),
			makeModel("claude-haiku", ["CHAT"], {
				costPer1KInput: 0.001,
				costPer1KOutput: 0.005,
				providerName: "anthropic",
			}),
		];
		const rules = [
			{
				id: "rule-1",
				capability: "CHAT" as ModelCapability,
				strategy: "cost_optimal" as const,
				allowedModelIds: [],
				excludedModelIds: [],
				maxRetries: 1,
				requiresAudit: false,
				fallbackStrategy: "capability_match" as const,
			},
		];
		const registry = new ModelRegistryService(
			mockModelRepo(models),
			mockRoutingRepo(),
		);
		const router = new AdaptiveRouter(
			registry,
			mockRoutingRepo(rules),
			mockAuditRepo(),
			mockAdapterFactory(),
			{ auditEnabled: true, defaultQualityGates: [] },
		);

		const result = await router.route("req-2", "CHAT", "Hello");

		expect(result.success).toBe(true);
	});

	it("returns failure when no models are available for capability", async () => {
		const registry = new ModelRegistryService(
			mockModelRepo([]),
			mockRoutingRepo(),
		);
		const router = new AdaptiveRouter(
			registry,
			mockRoutingRepo(),
			mockAuditRepo(),
			mockAdapterFactory(),
			{ auditEnabled: true, defaultQualityGates: [] },
		);

		const result = await router.route("req-3", "OCR", "Read text");

		expect(result.success).toBe(false);
		expect(result.errorMessage).toBe("No available models for capability");
	});

	it("returns failure when all adapters throw", async () => {
		const models = [makeModel("broken-model", ["CHAT"])];
		const factory: ProviderAdapterFactory = {
			createAdapter: mock(() => ({
				providerName: "openai" as const,
				modelName: "broken-model",
				sendRequest: mock(() => Promise.reject(new Error("API error"))),
				validateResponse: mock(() => false),
				checkHealth: mock(() =>
					Promise.resolve({
						status: "down" as const,
						latencyMs: 5000,
						errorRate: 1,
						lastCheckedAt: new Date(),
					}),
				),
				getCost: mock(() => 0),
			})),
		};
		const registry = new ModelRegistryService(
			mockModelRepo(models),
			mockRoutingRepo(),
		);
		const router = new AdaptiveRouter(
			registry,
			mockRoutingRepo(),
			mockAuditRepo(),
			factory,
			{
				auditEnabled: true,
				defaultQualityGates: [],
			},
		);

		const result = await router.route("req-4", "CHAT", "Hello");

		expect(result.success).toBe(false);
	});
});
