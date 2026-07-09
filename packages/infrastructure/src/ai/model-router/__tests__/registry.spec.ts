import { describe, expect, it, mock } from "bun:test";
import type {
	CapabilityRoutingRule,
	ModelCapability,
	ModelRegistration,
} from "@drenyra/ai/providers/model-router-types";
import type {
	CapabilityRoutingRuleRepository,
	ModelRegistrationRepository,
} from "@drenyra/domain/repositories/model-registration.repository";
import { ModelRegistryService } from "../registry";
import type { RoutingRequest } from "../types";

function makeModel(
	overrides: Partial<ModelRegistration> = {},
): ModelRegistration {
	return {
		id: "gpt-4o",
		providerName: "openai",
		modelName: "gpt-4o",
		displayName: "GPT-4o",
		capabilities: ["CHAT", "ANALYSIS", "EXTRACTION"],
		status: "ACTIVE",
		priority: 1,
		costPer1KInput: 0.01,
		costPer1KOutput: 0.03,
		maxTokens: 128_000,
		avgLatencyMs: 1200,
		reliability: 0.98,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
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

function mockRoutingRuleRepo(
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

describe("ModelRegistryService", () => {
	describe("registerModel", () => {
		it("saves a new model when id does not exist", async () => {
			const modelRepo = mockModelRepo();
			const service = new ModelRegistryService(
				modelRepo,
				mockRoutingRuleRepo(),
			);

			const result = await service.registerModel(makeModel());

			expect(result.id).toBe("gpt-4o");
			expect(modelRepo.save).toHaveBeenCalled();
			expect(modelRepo.update).not.toHaveBeenCalled();
		});

		it("updates an existing model when id exists", async () => {
			const existing = makeModel();
			const modelRepo = mockModelRepo([existing]);
			const service = new ModelRegistryService(
				modelRepo,
				mockRoutingRuleRepo(),
			);

			const updated = makeModel({ displayName: "GPT-4o Updated" });
			const result = await service.registerModel(updated);

			expect(result.displayName).toBe("GPT-4o Updated");
			expect(modelRepo.update).toHaveBeenCalled();
			expect(modelRepo.save).not.toHaveBeenCalled();
		});
	});

	describe("updateModelHealth", () => {
		it("updates health metrics for an existing model", async () => {
			const model = makeModel();
			const modelRepo = mockModelRepo([model]);
			const service = new ModelRegistryService(
				modelRepo,
				mockRoutingRuleRepo(),
			);

			const now = new Date();
			await service.updateModelHealth("gpt-4o", {
				modelId: "gpt-4o",
				status: "DEGRADED",
				latencyMs: 3000,
				errorRate: 0.1,
				consecutiveFailures: 3,
				checkedAt: now,
			});

			expect(modelRepo.update).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "gpt-4o",
					status: "DEGRADED",
					avgLatencyMs: 3000,
					reliability: 0.9,
				}),
			);
		});

		it("throws for unknown model", async () => {
			const service = new ModelRegistryService(
				mockModelRepo(),
				mockRoutingRuleRepo(),
			);

			expect(
				service.updateModelHealth("unknown", {
					modelId: "unknown",
					status: "OFFLINE",
					latencyMs: 0,
					errorRate: 1,
					consecutiveFailures: 1,
					checkedAt: new Date(),
				}),
			).rejects.toThrow("Model not found: unknown");
		});

		it("keeps existing reliability when errorRate is 0", async () => {
			const model = makeModel({ reliability: 0.95 });
			const modelRepo = mockModelRepo([model]);
			const service = new ModelRegistryService(
				modelRepo,
				mockRoutingRuleRepo(),
			);

			await service.updateModelHealth("gpt-4o", {
				modelId: "gpt-4o",
				status: "ACTIVE",
				latencyMs: 500,
				errorRate: 0,
				consecutiveFailures: 0,
				checkedAt: new Date(),
			});

			const call = (modelRepo.update as ReturnType<typeof mock>).mock
				.calls[0][0] as ModelRegistration;
			expect(call.reliability).toBe(0.95);
		});
	});

	describe("findModelsByCapability", () => {
		it("returns models matching a capability", async () => {
			const models = [
				makeModel({ id: "gpt-4o", capabilities: ["CHAT", "ANALYSIS"] }),
				makeModel({ id: "claude-3", capabilities: ["CHAT"] }),
			];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);

			const result = await service.findModelsByCapability("ANALYSIS");

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("gpt-4o");
		});

		it("returns empty array when no models match", async () => {
			const models = [makeModel({ capabilities: ["CHAT"] })];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);

			const result = await service.findModelsByCapability("CODING");

			expect(result).toEqual([]);
		});
	});

	describe("getRoutingRule", () => {
		it("returns the rule for a capability", async () => {
			const rule: CapabilityRoutingRule = {
				id: "rule-1",
				capability: "CHAT",
				strategy: "cost_optimal",
				allowedModelIds: [],
				excludedModelIds: [],
				maxRetries: 2,
				requiresAudit: true,
				fallbackStrategy: "capability_match",
			};
			const service = new ModelRegistryService(
				mockModelRepo(),
				mockRoutingRuleRepo([rule]),
			);

			const result = await service.getRoutingRule("CHAT");

			expect(result).not.toBeNull();
			expect(result?.strategy).toBe("cost_optimal");
		});

		it("returns null when no rule exists", async () => {
			const service = new ModelRegistryService(
				mockModelRepo(),
				mockRoutingRuleRepo(),
			);

			const result = await service.getRoutingRule("AUDIT");

			expect(result).toBeNull();
		});
	});

	describe("scoreModelsForCapability", () => {
		it("ranks ACTIVE models by composite score descending", async () => {
			const models = [
				makeModel({
					id: "cheap-slow",
					capabilities: ["CHAT"],
					costPer1KInput: 0.001,
					costPer1KOutput: 0.002,
					avgLatencyMs: 5000,
					reliability: 0.95,
					priority: 5,
				}),
				makeModel({
					id: "expensive-fast",
					capabilities: ["CHAT"],
					costPer1KInput: 0.05,
					costPer1KOutput: 0.15,
					avgLatencyMs: 300,
					reliability: 0.99,
					priority: 1,
				}),
			];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);
			const request: RoutingRequest = {
				capability: "CHAT",
				contextSize: 100,
				maxCostCents: 50,
				maxLatencyMs: 10_000,
			};

			const scores = await service.scoreModelsForCapability("CHAT", request);

			expect(scores).toHaveLength(2);
			expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score);
		});

		it("filters out non-ACTIVE models", async () => {
			const models = [
				makeModel({
					id: "active-model",
					status: "ACTIVE",
					capabilities: ["CHAT"],
				}),
				makeModel({
					id: "offline-model",
					status: "OFFLINE",
					capabilities: ["CHAT"],
				}),
				makeModel({
					id: "degraded-model",
					status: "DEGRADED",
					capabilities: ["CHAT"],
				}),
			];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);
			const request: RoutingRequest = { capability: "CHAT", contextSize: 100 };

			const scores = await service.scoreModelsForCapability("CHAT", request);

			expect(scores).toHaveLength(1);
			expect(scores[0].modelId).toBe("active-model");
		});

		it("returns empty for unknown capability", async () => {
			const models = [makeModel({ capabilities: ["CHAT"] })];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);
			const request: RoutingRequest = {
				capability: "CODING",
				contextSize: 100,
			};

			const scores = await service.scoreModelsForCapability("CODING", request);

			expect(scores).toEqual([]);
		});

		it("each score entry has correct shape", async () => {
			const models = [makeModel({ capabilities: ["CHAT"] })];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);
			const request: RoutingRequest = { capability: "CHAT", contextSize: 100 };

			const scores = await service.scoreModelsForCapability("CHAT", request);

			expect(scores[0]).toEqual(
				expect.objectContaining({
					modelId: "gpt-4o",
					capability: "CHAT",
					score: expect.any(Number),
					costCents: expect.any(Number),
					latencyMs: expect.any(Number),
					reliability: expect.any(Number),
				}),
			);
		});
	});

	describe("getOptimalModel", () => {
		it("returns the highest-scored model within budget", async () => {
			const models = [
				makeModel({
					id: "pricey",
					capabilities: ["CHAT"],
					costPer1KInput: 0.05,
					costPer1KOutput: 0.15,
				}),
				makeModel({
					id: "budget",
					capabilities: ["CHAT"],
					costPer1KInput: 0.001,
					costPer1KOutput: 0.002,
				}),
			];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);
			const request: RoutingRequest = {
				capability: "CHAT",
				contextSize: 100,
				maxCostCents: 10,
			};

			const result = await service.getOptimalModel("CHAT", request);

			expect(result).not.toBeNull();
			expect(result?.id).toBe("budget");
		});

		it("returns null when no model fits constraints", async () => {
			const models = [
				makeModel({
					id: "expensive",
					capabilities: ["CHAT"],
					costPer1KInput: 1,
					costPer1KOutput: 3,
				}),
			];
			const service = new ModelRegistryService(
				mockModelRepo(models),
				mockRoutingRuleRepo(),
			);
			const request: RoutingRequest = {
				capability: "CHAT",
				contextSize: 100,
				maxCostCents: 1,
			};

			const result = await service.getOptimalModel("CHAT", request);

			expect(result).toBeNull();
		});
	});
});
