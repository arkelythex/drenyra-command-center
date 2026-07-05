/**
 * @fileoverview Process machine factory barrel.
 *
 * Re-exports all public types and the factory function.
 *
 * @example
 * ```ts
 * import { createProcessMachine } from "@/lib/process-machine";
 * import type { ProcessStatus, ProcessBaseContext, ProcessMachineConfig } from "@/lib/process-machine";
 * ```
 */

export { createProcessMachine } from "./machine";
export type {
	ProcessBaseContext,
	ProcessMachineConfig,
	ProcessStatus,
} from "./types";
