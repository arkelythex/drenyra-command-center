/**
 * CLI memory snapshot (Hermes-style MEMORY.md + USER.md) passed via context.metadata.
 * Treated as active instructions — not background reference (see Hermes #17251).
 */
export type CliMemorySnapshot = {
	persistentMemory?: string | undefined;
	userContext?: string | undefined;
	memoryPct?: number | undefined;
	userPct?: number | undefined;
};

const MEMORY_PCT_WARN = 80;

export function extractCliMemory(
	metadata?: Record<string, unknown>,
): CliMemorySnapshot | null {
	if (!metadata || typeof metadata !== "object") return null;
	const snap = metadata.memorySnapshot === true;
	const mem = metadata.persistentMemory;
	const user = metadata.userContext;
	if (!snap && typeof mem !== "string" && typeof user !== "string") {
		return null;
	}
	return {
		persistentMemory: typeof mem === "string" ? mem : undefined,
		userContext: typeof user === "string" ? user : undefined,
		memoryPct:
			typeof metadata.memoryPct === "number" ? metadata.memoryPct : undefined,
		userPct:
			typeof metadata.userPct === "number" ? metadata.userPct : undefined,
	};
}

export function memoryPromptBlock(snapshot: CliMemorySnapshot | null): string {
	if (!snapshot) return "";
	const parts: string[] = [];
	if (snapshot.persistentMemory?.trim()) {
		parts.push(`[Persistent memory]\n${snapshot.persistentMemory.trim()}`);
	}
	if (snapshot.userContext?.trim()) {
		parts.push(`[User context]\n${snapshot.userContext.trim()}`);
	}
	if (parts.length === 0) return "";
	const warn =
		(snapshot.memoryPct ?? 0) >= MEMORY_PCT_WARN ||
		(snapshot.userPct ?? 0) >= MEMORY_PCT_WARN
			? "\n(note: memory store above 80% capacity — consolidate entries in ~/.drenyra/memories/)"
			: "";
	return `${parts.join("\n\n")}${warn}`;
}

export function enrichSummary(
	base: string,
	snapshot: CliMemorySnapshot | null,
): string {
	const block = memoryPromptBlock(snapshot);
	if (!block) return base;
	return `${base}\n\n---\n${block}`;
}
