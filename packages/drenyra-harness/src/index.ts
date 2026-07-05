/**
 * @drenyra/harness — Backward-compatible re-exports
 *
 * This package now re-exports from @drenyra/agents.
 * New code should import directly from @drenyra/agents.
 *
 * @deprecated Import from @drenyra/agents instead
 *   import { createDrenyraHarness } from "@drenyra/agents";
 */

export {
	createDrenyraHarness,
	createDrenyraHarness as createDrenyraHarness,
	DrenyraHarness,
} from "@drenyra/agents";
export {
	createDefaultHandler,
	registerDefaultHandlers,
} from "@drenyra/agents";
export type {
	HarnessExecuteResponse,
	HarnessOptions,
	AgentHandler,
} from "@drenyra/agents";
