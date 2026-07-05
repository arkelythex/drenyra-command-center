import type {
	SunatCpeValidationRequest,
	SunatCpeValidationResponse,
} from "../../infrastructure/sunat-cpe-client";
import {
	type SunatFallbackHitlRequest,
	SunatVisualFallbackSubagent,
} from "./sunat-visual-subagent";

/**
 * SunatValidationSource type.
 *
 * @example
 * ```ts
 * const value: SunatValidationSource = {} as SunatValidationSource;
 * console.log(value);
 * ```
 */
export type SunatValidationSource =
	| "sunat_api"
	| "sunat_sandbox"
	| "sunat_replay"
	| "visual_subagent";

/**
 * SunatFallbackOrchestrationResult interface.
 *
 * @example
 * ```ts
 * const value: SunatFallbackOrchestrationResult = {} as SunatFallbackOrchestrationResult;
 * console.log(value);
 * ```
 */
export interface SunatFallbackOrchestrationResult {
	response: SunatCpeValidationResponse;
	source: SunatValidationSource;
	fallbackActivated: boolean;
	fallbackReason?: string;
	hitl?: SunatFallbackHitlRequest;
	traceSteps: string[];
	orchestrationMs: number;
}

interface SunatPrimaryClient {
	validate(
		request: SunatCpeValidationRequest,
	): Promise<SunatCpeValidationResponse>;
}

function resolveBudgetMs(): number {
	const raw = Number(process.env.SUNAT_AGENTIC_FALLBACK_TIMEOUT_MS ?? 12_000);
	if (!Number.isFinite(raw) || raw < 500) return 12_000;
	return Math.floor(raw);
}

function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	label: string,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`${label}_TIMEOUT`));
		}, timeoutMs);

		promise
			.then((value) => {
				clearTimeout(timer);
				resolve(value);
			})
			.catch((error) => {
				clearTimeout(timer);
				reject(error);
			});
	});
}

function isRetryableSunatError(error: unknown): boolean {
	const message =
		error instanceof Error
			? error.message.toLowerCase()
			: String(error).toLowerCase();
	return (
		message.includes("timeout") ||
		message.includes("network") ||
		message.includes("503") ||
		message.includes("econnreset") ||
		message.includes("not implemented")
	);
}

/**
 * SunatFallbackOrchestrator class.
 *
 * @example
 * ```ts
 * const value = new SunatFallbackOrchestrator();
 * console.log(value);
 * ```
 */
export class SunatFallbackOrchestrator {
	private readonly budgetMs = resolveBudgetMs();

	constructor(
		private readonly primaryClient: SunatPrimaryClient,
		private readonly visualSubagent = new SunatVisualFallbackSubagent(),
	) {}

	async validate(
		request: SunatCpeValidationRequest,
	): Promise<SunatFallbackOrchestrationResult> {
		const startedAt = Date.now();

		try {
			const response = await withTimeout(
				this.primaryClient.validate(request),
				this.budgetMs,
				"SUNAT_API",
			);
			const source = this.resolvePrimarySource(response);
			return {
				response,
				source,
				fallbackActivated: false,
				traceSteps: [`${source}:request`, `${source}:response`],
				orchestrationMs: Date.now() - startedAt,
			};
		} catch (error) {
			if (!isRetryableSunatError(error)) {
				throw error;
			}

			const fallback = await withTimeout(
				this.visualSubagent.run(request),
				this.budgetMs,
				"SUNAT_VISUAL_FALLBACK",
			);

			return {
				response: fallback.response,
				source: "visual_subagent",
				fallbackActivated: true,
				fallbackReason:
					error instanceof Error ? error.message : "sunat_api_unavailable",
				hitl: fallback.hitl,
				traceSteps: [
					"sunat_api:error",
					...fallback.trace.steps.map((step) => `visual_subagent:${step}`),
				],
				orchestrationMs: Date.now() - startedAt,
			};
		}
	}

	private resolvePrimarySource(
		response: SunatCpeValidationResponse,
	): SunatValidationSource {
		if (response.mode === "sandbox") {
			return "sunat_sandbox";
		}

		if (response.mode === "replay") {
			return "sunat_replay";
		}

		return "sunat_api";
	}
}
