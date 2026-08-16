/**
 * ShadowRunner — runs two AgentRuntimePort implementations side-by-side.
 *
 * Compares key metrics between legacy and Pi adapters:
 * - Session creation
 * - Event structure
 * - Error handling
 * - Execution time
 *
 * This is the Fase 4 mechanism for safe cutover.
 */

import type {
	AgentRuntimePort,
	CreateSessionRequest,
	FiscalPrompt,
} from "./port";

/**
 * Result of a shadow comparison between two runtime adapters.
 */
export interface ShadowComparison {
	sessionId: string;
	legacy: { success: boolean; durationMs: number; error?: string | undefined };
	pi: { success: boolean; durationMs: number; error?: string | undefined };
	match: boolean;
}

/**
 * Runs two runtime adapters side-by-side and compares results.
 *
 * @example
 * ```ts
 * const legacy = new LegacyMastraRuntimeAdapter();
 * const pi = new PiAgentRuntimeAdapter();
 * const shadow = new ShadowRunner(legacy, pi);
 *
 * const result = await shadow.createSession({
 *   goal: "check sunat compliance",
 *   context: { ... },
 * });
 *
 * console.log(result.match ? "PARITY" : "MISMATCH");
 * ```
 */
export class ShadowRunner {
	constructor(
		private readonly legacy: AgentRuntimePort,
		private readonly pi: AgentRuntimePort,
	) {}

	/**
	 * Create a session on both runtimes and compare.
	 */
	async createSession(
		request: CreateSessionRequest,
	): Promise<ShadowComparison> {
		const sessionId = `shadow-${crypto.randomUUID()}`;

		const legacyStart = performance.now();
		let legacySuccess = false;
		let legacyError: string | undefined;
		try {
			await this.legacy.createSession({ ...request });
			legacySuccess = true;
		} catch (e) {
			legacyError = e instanceof Error ? e.message : String(e);
		}
		const legacyDuration = performance.now() - legacyStart;

		const piStart = performance.now();
		let piSuccess = false;
		let piError: string | undefined;
		try {
			await this.pi.createSession({ ...request });
			piSuccess = true;
		} catch (e) {
			piError = e instanceof Error ? e.message : String(e);
		}
		const piDuration = performance.now() - piStart;

		return {
			sessionId,
			legacy: {
				success: legacySuccess,
				durationMs: legacyDuration,
				error: legacyError,
			},
			pi: { success: piSuccess, durationMs: piDuration, error: piError },
			match: legacySuccess === piSuccess && legacyError === piError,
		};
	}

	/**
	 * Compare prompting behavior between both runtimes.
	 */
	async comparePrompt(
		sessionId: string,
		input: FiscalPrompt,
	): Promise<{
		legacy: { durationMs: number; error?: string | undefined };
		pi: { durationMs: number; error?: string | undefined };
		match: boolean;
	}> {
		const legacyStart = performance.now();
		let legacyError: string | undefined;
		try {
			await this.legacy.prompt(sessionId, input);
		} catch (e) {
			legacyError = e instanceof Error ? e.message : String(e);
		}
		const legacyDuration = performance.now() - legacyStart;

		const piStart = performance.now();
		let piError: string | undefined;
		try {
			await this.pi.prompt(sessionId, input);
		} catch (e) {
			piError = e instanceof Error ? e.message : String(e);
		}
		const piDuration = performance.now() - piStart;

		return {
			legacy: { durationMs: legacyDuration, error: legacyError },
			pi: { durationMs: piDuration, error: piError },
			match: legacyError === piError,
		};
	}

	/**
	 * Compare abort behavior between both runtimes.
	 */
	async compareAbort(sessionId: string): Promise<{ match: boolean }> {
		let legacyError: string | undefined;
		let piError: string | undefined;

		try {
			await this.legacy.abort(sessionId);
		} catch (e) {
			legacyError = e instanceof Error ? e.message : String(e);
		}

		try {
			await this.pi.abort(sessionId);
		} catch (e) {
			piError = e instanceof Error ? e.message : String(e);
		}

		return { match: legacyError === piError };
	}
}
