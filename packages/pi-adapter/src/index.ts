/**
 * @drenyra/pi-adapter — Pi SDK adapter for Drenyra agent runtime
 *
 * Provides the hexagonal port interface (AgentRuntimePort) and its
 * Pi SDK implementation (PiAgentRuntimeAdapter).
 *
 * Also includes legacy adapter for shadow execution and migration.
 */

export type { AgentRuntimePort } from "./port";
export type {
	SessionHandle,
	FiscalPrompt,
	RuntimeEvent,
	RuntimeEventType,
	RuntimeEventListener,
	CreateSessionRequest,
	ForkSessionRequest,
	Unsubscribe,
} from "./port";
export { PiAgentRuntimeAdapter } from "./pi-adapter";
export { LegacyMastraRuntimeAdapter } from "./legacy-adapter";
export { ShadowRunner } from "./shadow-runner";
export type { ShadowComparison } from "./shadow-runner";
