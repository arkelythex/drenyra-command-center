/**
 * Memory Module Barrel
 *
 * Exports MemoryContextProvider for injecting past run context
 * into agent prompts.
 *
 * @module ai/memory
 */

export { MemoryContextProvider } from "../services/memory-context";
export type { MemoryContext, MemoryConfig } from "../services/memory-context";
