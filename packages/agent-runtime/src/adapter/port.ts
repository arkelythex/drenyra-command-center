/**
 * AgentRuntimePort — hexagonal port interface for the agent runtime.
 *
 * This is the Drenyxa-side contract that any runtime adapter must satisfy.
 * Pi is the primary implementation, but this port enables:
 * - Testing without Pi (in-memory mock)
 * - Future runtime replacement
 * - Clean separation between domain and infrastructure
 */

import type { AgentContext } from "@drenyra/fiscal-agent-domain/agent-context";

/**
 * Opaque handle to an active agent session.
 */
export interface SessionHandle {
	readonly sessionId: string;
	readonly createdAt: Date;
}

/**
 * A prompt to send to an agent session, scoped with fiscal context.
 */
export interface FiscalPrompt {
	/** The text prompt */
	text: string;
	/** Fiscal context for scoping */
	context: AgentContext;
	/** Optional images to include */
	images?: Array<{
		type: "image";
		source: { type: "base64"; mediaType: string; data: string };
	}>;
}

/**
 * Runtime event types that the port consumer can subscribe to.
 */
export type RuntimeEventType =
	| "message_delta"
	| "thinking_delta"
	| "tool_execution_start"
	| "tool_execution_end"
	| "turn_start"
	| "turn_end"
	| "agent_start"
	| "agent_end"
	| "error";

/**
 * A runtime event emitted during agent execution.
 */
export interface RuntimeEvent {
	type: RuntimeEventType;
	sessionId: string;
	timestamp: Date;
	payload: unknown;
}

/**
 * Callback type for runtime event listeners.
 */
export type RuntimeEventListener = (event: RuntimeEvent) => void;

/**
 * Request to create a new agent session.
 */
export interface CreateSessionRequest {
	/** Initial goal/prompt for the session */
	goal: string;
	/** Fiscal context */
	context: AgentContext;
	/** Optional parent session ID for delegation chains */
	parentSessionId?: string;
	/** Optional model override */
	model?: string;
}

/**
 * Request to fork/child a session.
 */
export interface ForkSessionRequest {
	/** Source session ID to fork from */
	sourceSessionId: string;
	/** New context for the forked session */
	context: AgentContext;
	/** Optional entry point in the source session tree */
	entryId?: string;
}

/**
 * Unsubscribe function returned by subscribe().
 */
export type Unsubscribe = () => void;

/**
 * Hexagonal port for the agent runtime.
 *
 * Drenyxa domain code depends ON this port.
 * Adapters (Pi, mock, legacy) implement this port.
 */
export interface AgentRuntimePort {
	/**
	 * Create a new agent session.
	 */
	createSession(request: CreateSessionRequest): Promise<SessionHandle>;

	/**
	 * Send a prompt to an existing session and wait for completion.
	 */
	prompt(sessionId: string, input: FiscalPrompt): Promise<void>;

	/**
	 * Subscribe to runtime events from a session.
	 */
	subscribe(sessionId: string, listener: RuntimeEventListener): Unsubscribe;

	/**
	 * Fork/create a child session from an existing one.
	 */
	fork(request: ForkSessionRequest): Promise<SessionHandle>;

	/**
	 * Abort a running session.
	 */
	abort(sessionId: string): Promise<void>;

	/**
	 * Get the current session state summary.
	 */
	getSession(
		sessionId: string,
	): Promise<{ status: string; messageCount: number } | null>;
}
