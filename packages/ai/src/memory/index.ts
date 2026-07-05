/**
 * Memory Module Barrel
 *
 * Exports MemoryContextProvider for injecting past run context
 * into agent prompts.
 *
 * @module ai/memory
 */

export type { MemoryConfig, MemoryContext } from "../services/memory-context";
export { MemoryContextProvider } from "../services/memory-context";
