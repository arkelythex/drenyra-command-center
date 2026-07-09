/**
 * Drenyra Orchestrator — Memory Contract
 *
 * Defines the protocol for memory management between the orchestrator
 * and subagents: who reads context, who writes discoveries, and how
 * SDD phase artifacts are keyed and persisted.
 */

import type { MemoryContract } from "./types";
import { DRENYRA_SDD_ARTIFACT_KEYS } from "./types";

// ============================================================================
// Default Contract
// ============================================================================

/** Default memory contract for Drenyra. */
export const DEFAULT_MEMORY_CONTRACT: MemoryContract = {
	readBy: "orchestrator",
	writeBy: "subagent",
	artifactKeys: DRENYRA_SDD_ARTIFACT_KEYS,
	memoryAvailable: false, // Detected at runtime
};

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build a context prompt for a subagent based on the memory contract.
 *
 * In orchestrator-read mode:
 *   The parent searches Engram, selects relevant observations,
 *   and passes them in the subagent prompt.
 *
 * In subagent-read mode:
 *   The subagent searches memory independently.
 */
export function buildMemoryInstructions(
	contract: MemoryContract,
	project: string,
	relevantKeys?: string[],
): string {
	const instructions: string[] = [];
	const changeKeys = contract.artifactKeys;

	instructions.push("## Memory Context");

	if (contract.readBy === "orchestrator") {
		instructions.push(
			"- The orchestrator has searched memory and passed relevant context above.",
			"- Do NOT search Engram or other memory yourself.",
			"- Use only the context provided to you.",
		);
	} else {
		instructions.push(
			"- Search Engram for relevant context before starting work.",
			"- Use the available memory tools with project scope.",
		);
	}

	if (contract.writeBy === "subagent" || contract.writeBy === "both") {
		instructions.push(
			"",
			"## Memory Save Requirement",
			"- If you make important discoveries, decisions, or fix bugs, save them to Engram.",
			`- Use mem_save with project: '${project}' before returning.`,
			"- Format: title (short, searchable), type (bugfix|decision|architecture|discovery|pattern), scope (project), and structured content.",
		);
	}

	if (relevantKeys && relevantKeys.length > 0) {
		instructions.push("", "## Artifact Keys (SDD artifacts to read)");
		for (const key of relevantKeys) {
			const resolvedKey = changeKeys[key];
			if (resolvedKey) {
				instructions.push(`- \`${key}\`: \`${resolvedKey}\``);
			}
		}
	}

	return instructions.join("\n");
}

// ============================================================================
// Memory-Availability Check
// ============================================================================

/**
 * Returns whether callable memory tools are likely available.
 * This is a runtime check that the orchestrator performs at session start.
 */
export function checkMemoryAvailable(): boolean {
	// At runtime, the orchestrator checks if Engram tools are callable.
	// This is a proxy: if Pi's mem_* tools respond, memory is available.
	try {
		// If we can access the global mem_* API, memory is available.
		return typeof globalThis !== "undefined" && "mem_search" in globalThis;
	} catch {
		return false;
	}
}
