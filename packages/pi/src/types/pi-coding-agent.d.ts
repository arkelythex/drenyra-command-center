/**
 * Ambient module declaration for `@earendil-works/pi-coding-agent`.
 *
 * `packages/pi` is intentionally zero-dependency: the Pi SDK is only required
 * at runtime when a Pi host actually drives Drenyra's fiscal agent runtime.
 * The adapter (`src/adapter/pi-adapter.ts`) therefore loads it with dynamic
 * `import()` calls. This declaration mirrors the minimal API surface used by
 * the adapter so the package typechecks without a hard dependency.
 *
 * Keep this shim in sync with the real SDK surface when the adapter grows.
 * Reference: https://www.npmjs.com/package/@earendil-works/pi-coding-agent
 */

declare module "@earendil-works/pi-coding-agent" {
	export interface AgentSessionEvent {
		type: string;
		[key: string]: unknown;
	}

	export interface AgentSessionMessage {
		[key: string]: unknown;
	}

	export interface CreateAgentSessionOptions {
		sessionManager?: SessionManager;
		tools?: string[];
		[key: string]: unknown;
	}

	export interface CreateAgentSessionResult {
		session: AgentSession;
		modelFallbackMessage?: unknown;
	}

	export class SessionManager {
		static inMemory(cwd?: string, options?: unknown): SessionManager;
	}

	export class AgentSession {
		readonly sessionId: string;
		readonly isStreaming: boolean;
		readonly messages: AgentSessionMessage[];
		prompt(text: string, options?: unknown): Promise<void>;
		subscribe(listener: (event: AgentSessionEvent) => void): () => void;
		abort(): Promise<void>;
		dispose(): void;
	}

	export function createAgentSession(
		options?: CreateAgentSessionOptions,
	): Promise<CreateAgentSessionResult>;
}
