/**
 * @drenyra/pi-adapter — Pi SDK adapter for Drenyra agent runtime
 *
 * Provides the hexagonal port interface (AgentRuntimePort) and its
 * Pi SDK implementation (PiAgentRuntimeAdapter).
 *
 * Also includes legacy adapter for shadow execution and migration.
 */

export { LegacyMastraRuntimeAdapter } from "./legacy-adapter";
export { PiAgentRuntimeAdapter } from "./pi-adapter";
export type {
	AgentRuntimePort,
	CreateSessionRequest,
	FiscalPrompt,
	ForkSessionRequest,
	RuntimeEvent,
	RuntimeEventListener,
	RuntimeEventType,
	SessionHandle,
	Unsubscribe,
} from "./port";
export type { ShadowComparison } from "./shadow-runner";
export { ShadowRunner } from "./shadow-runner";
