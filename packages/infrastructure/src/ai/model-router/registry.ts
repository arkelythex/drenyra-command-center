import type {
	CapabilityRoutingRule,
	ModelCapability,
	ModelHealthProbe,
	ModelRegistration,
} from "@drenyra/ai/providers/model-router-types";
import type {
	CapabilityRoutingRuleRepository,
	ModelRegistrationRepository,
} from "@drenyra/domain/repositories/model-registration.repository";
import type { CapabilityScore, RouterConfig, RoutingRequest } from "./types";

export class ModelRegistryService {
	constructor(
		private readonly modelRepo: ModelRegistrationRepository,
		private readonly routingRuleRepo: CapabilityRoutingRuleRepository,
		readonly _config: RouterConfig = {
			defaultStrategy: "capability_match",
			auditEnabled: true,
			probeCadenceMs: 60_000,
		},
	) {}

	async registerModel(
		registration: ModelRegistration,
	): Promise<ModelRegistration> {
		const existing = await this.modelRepo.findById(registration.id);
		if (existing) {
			return this.modelRepo.update(registration);
		}
		return this.modelRepo.save(registration);
	}

	async updateModelHealth(
		modelId: string,
		probe: ModelHealthProbe,
	): Promise<void> {
		const model = await this.modelRepo.findById(modelId);
		if (!model) {
			throw new Error(`Model not found: ${modelId}`);
		}

		const reliability =
			probe.errorRate > 0
				? Math.max(0, 1 - probe.errorRate)
				: (model.reliability ?? 1);

		await this.modelRepo.update({
			...model,
			status: probe.status,
			avgLatencyMs: probe.latencyMs,
			reliability,
			updatedAt: new Date(),
		});
	}

	async findModelsByCapability(
		capability: ModelCapability,
	): Promise<ModelRegistration[]> {
		return this.modelRepo.findByCapability(capability);
	}

	async getRoutingRule(
		capability: ModelCapability,
	): Promise<CapabilityRoutingRule | null> {
		return this.routingRuleRepo.findByCapability(capability);
	}

	async scoreModelsForCapability(
		capability: ModelCapability,
		request: RoutingRequest,
	): Promise<CapabilityScore[]> {
		const models = await this.modelRepo.findByCapability(capability);

		return models
			.filter((m) => m.status === "ACTIVE")
			.map((m) => ({
				modelId: m.id,
				capability,
				score: this.calculateScore(m, request),
				costCents: m.costPer1KInput + m.costPer1KOutput,
				latencyMs: m.avgLatencyMs ?? 5000,
				reliability: m.reliability ?? 0.9,
			}))
			.sort((a, b) => b.score - a.score);
	}

	async getOptimalModel(
		capability: ModelCapability,
		request: RoutingRequest,
	): Promise<ModelRegistration | null> {
		const scored = await this.scoreModelsForCapability(capability, request);

		const filtered = scored.filter((s) => {
			if (request.maxCostCents && s.costCents > request.maxCostCents) {
				return false;
			}
			if (request.maxLatencyMs && s.latencyMs > request.maxLatencyMs) {
				return false;
			}
			return true;
		});

		if (filtered.length === 0) {
			return null;
		}

		const best = filtered[0];
		return this.modelRepo.findById(best.modelId);
	}

	private calculateScore(
		model: ModelRegistration,
		request: RoutingRequest,
	): number {
		const costScore = request.maxCostCents
			? 1 -
				(model.costPer1KInput + model.costPer1KOutput) / request.maxCostCents
			: 1;

		const latencyScore = model.avgLatencyMs
			? request.maxLatencyMs
				? 1 - model.avgLatencyMs / request.maxLatencyMs
				: 0.5
			: 0.3;

		const reliabilityScore = model.reliability ?? 0.9;
		const priorityScore = 1 - model.priority / 1000;

		return (
			costScore * 0.3 +
			latencyScore * 0.2 +
			reliabilityScore * 0.3 +
			priorityScore * 0.2
		);
	}
}
