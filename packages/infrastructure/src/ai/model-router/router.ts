import type {
	ModelCapability,
	RouterStrategy,
	RoutingResult,
} from "@drenyra/ai/providers/model-router-types";
import type {
	CapabilityRoutingRuleRepository,
	RoutingAuditLogRepository,
} from "@drenyra/domain/repositories/model-registration.repository";
import { FallbackExecutor } from "./fallback-executor";
import type { ProviderAdapterFactory } from "./provider-adapter.types";
import {
	CostCapEnforcer,
	type QualityGate,
	ReputationGate,
	ResponseValidator,
} from "./quality-gates";
import type { ModelRegistryService } from "./registry";

export interface RouterOptions {
	auditEnabled: boolean;
	defaultQualityGates: QualityGate[];
}

export class AdaptiveRouter {
	private readonly fallbackExecutor: FallbackExecutor;

	constructor(
		private readonly registryService: ModelRegistryService,
		private readonly routingRuleRepo: CapabilityRoutingRuleRepository,
		private readonly auditRepo: RoutingAuditLogRepository,
		private readonly adapterFactory: ProviderAdapterFactory,
		private readonly options: RouterOptions = {
			auditEnabled: true,
			defaultQualityGates: [new ResponseValidator(), new ReputationGate(0.7)],
		},
	) {
		this.fallbackExecutor = new FallbackExecutor(auditRepo, {
			maxRetries: 3,
			retryDelayMs: 1000,
			qualityGates: options.defaultQualityGates,
		});
	}

	async route(
		requestId: string,
		capability: ModelCapability,
		prompt: string,
		systemPrompt?: string,
	): Promise<RoutingResult> {
		const rule = await this.routingRuleRepo.findByCapability(capability);
		const strategy = rule?.strategy ?? "capability_match";

		switch (strategy) {
			case "cost_optimal":
				return this.routeByStrategy(
					requestId,
					capability,
					prompt,
					systemPrompt,
					"cost_optimal",
					rule,
				);
			case "latency_optimal":
				return this.routeByStrategy(
					requestId,
					capability,
					prompt,
					systemPrompt,
					"latency_optimal",
					rule,
				);
			case "quality_preferred":
				return this.routeByStrategy(
					requestId,
					capability,
					prompt,
					systemPrompt,
					"quality_preferred",
					rule,
				);
			default:
				return this.routeByStrategy(
					requestId,
					capability,
					prompt,
					systemPrompt,
					"capability_match",
					rule,
				);
		}
	}

	private async routeByStrategy(
		requestId: string,
		capability: ModelCapability,
		prompt: string,
		systemPrompt: string | undefined,
		strategy: RouterStrategy,
		rule?: { costCapCents?: number; maxRetries?: number } | null,
	): Promise<RoutingResult> {
		const request = {
			capability,
			contextSize: prompt.length,
			maxCostCents: rule?.costCapCents,
		};

		const scored = await this.registryService.scoreModelsForCapability(
			capability,
			request,
		);

		if (scored.length === 0) {
			return {
				requestId,
				capability,
				selectedModelId: "none",
				providerName: "openrouter",
				modelName: "none",
				strategy,
				success: false,
				fallbackAttempted: false,
				attemptNumber: 1,
				errorMessage: "No available models for capability",
				timestamp: new Date(),
			};
		}

		const sorted = [...scored];
		switch (strategy) {
			case "cost_optimal":
				sorted.sort((a, b) => a.costCents - b.costCents);
				break;
			case "latency_optimal":
				sorted.sort((a, b) => a.latencyMs - b.latencyMs);
				break;
			case "quality_preferred":
				sorted.sort((a, b) => b.reliability - a.reliability);
				break;
			default:
				sorted.sort((a, b) => b.score - a.score);
		}

		const primary = sorted[0];
		const fallbacks = sorted.slice(1);

		const primaryAdapter = this.adapterFactory.createAdapter(
			primary.modelId,
			primary.modelId,
		);
		const fallbackAdapters = fallbacks.map((f) =>
			this.adapterFactory.createAdapter(f.modelId, f.modelId),
		);

		const gates: QualityGate[] = [...this.options.defaultQualityGates];
		if (rule?.costCapCents) {
			gates.push(new CostCapEnforcer(rule.costCapCents));
		}

		const executor = new FallbackExecutor(this.auditRepo, {
			maxRetries: rule?.maxRetries ?? 3,
			retryDelayMs: 1000,
			qualityGates: gates,
		});

		return executor.executeWithFallback(
			requestId,
			capability,
			primaryAdapter,
			fallbackAdapters,
			prompt,
			systemPrompt,
		);
	}
}
