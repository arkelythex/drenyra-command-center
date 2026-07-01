import type {
	ModelCapability,
	RoutingResult,
} from "@arkelythex/domain/ai/model-router/types";
import type { RoutingAuditLogRepository } from "@arkelythex/domain/repositories/model-registration.repository";
import type { ProviderAdapter } from "./provider-adapter.types";
import { type QualityGate, runQualityGates } from "./quality-gates";

export interface FallbackConfig {
	maxRetries: number;
	retryDelayMs: number;
	qualityGates: QualityGate[];
}

export class FallbackExecutor {
	constructor(
		private readonly auditRepo: RoutingAuditLogRepository,
		private readonly config: FallbackConfig = {
			maxRetries: 3,
			retryDelayMs: 1000,
			qualityGates: [],
		},
	) {}

	async executeWithFallback(
		requestId: string,
		capability: ModelCapability,
		primary: ProviderAdapter,
		fallbacks: ProviderAdapter[],
		prompt: string,
		systemPrompt?: string,
	): Promise<RoutingResult> {
		const attempts = [primary, ...fallbacks];
		let lastError: string | undefined;

		for (
			let i = 0;
			i < Math.min(attempts.length, this.config.maxRetries);
			i++
		) {
			const adapter = attempts[i];
			const attemptNumber = i + 1;

			try {
				const response = await adapter.sendRequest({
					prompt,
					systemPrompt,
					capability,
				});

				const { passed } = await runQualityGates(
					this.config.qualityGates,
					response,
				);

				if (!passed && i < attempts.length - 1) {
					lastError = `Quality gate failed for ${adapter.modelName}`;
					await this.auditRepo.save({
						requestId: `${requestId}-attempt-${attemptNumber}`,
						capability,
						selectedModelId: adapter.modelName,
						providerName: adapter.providerName,
						modelName: adapter.modelName,
						strategy: "fallback_chain",
						latencyMs: response.latencyMs,
						costCents: response.costCents,
						success: false,
						fallbackAttempted: true,
						attemptNumber,
						errorMessage: lastError,
						timestamp: new Date(),
					});
					await this.delay(this.config.retryDelayMs);
					continue;
				}

				const result: RoutingResult = {
					requestId: `${requestId}-attempt-${attemptNumber}`,
					capability,
					selectedModelId: adapter.modelName,
					providerName: adapter.providerName,
					modelName: adapter.modelName,
					strategy: i > 0 ? "fallback_chain" : "capability_match",
					latencyMs: response.latencyMs,
					costCents: response.costCents,
					success: true,
					fallbackAttempted: i > 0,
					attemptNumber,
					timestamp: new Date(),
				};

				await this.auditRepo.save(result);
				return result;
			} catch (error) {
				lastError = error instanceof Error ? error.message : String(error);

				await this.auditRepo.save({
					requestId: `${requestId}-attempt-${attemptNumber}`,
					capability,
					selectedModelId: adapter.modelName,
					providerName: adapter.providerName,
					modelName: adapter.modelName,
					strategy: "fallback_chain",
					success: false,
					fallbackAttempted: i > 0,
					attemptNumber,
					errorMessage: lastError,
					timestamp: new Date(),
				});

				if (i < attempts.length - 1) {
					await this.delay(this.config.retryDelayMs);
				}
			}
		}

		return {
			requestId,
			capability,
			selectedModelId: primary.modelName,
			providerName: primary.providerName,
			modelName: primary.modelName,
			strategy: "fallback_chain",
			success: false,
			fallbackAttempted: true,
			attemptNumber: attempts.length,
			errorMessage: lastError ?? "All providers failed",
			timestamp: new Date(),
		};
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
