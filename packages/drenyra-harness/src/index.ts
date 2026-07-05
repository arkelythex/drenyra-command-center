/**
 * @drenyra/harness — Backward-compatible re-exports
 *
 * This package now re-exports from @drenyra/agents.
 * New code should import directly from @drenyra/agents.
 *
 * @deprecated Import from @drenyra/agents instead
 *   import { createDrenyraHarness } from "@drenyra/agents";
 */

export type {
	AgentHandler,
	HarnessExecuteResponse,
	HarnessOptions,
} from "@drenyra/agents";
export {
	createDefaultHandler,
	createDrenyraHarness,
	DrenyraHarness,
	registerDefaultHandlers,
} from "@drenyra/agents";
