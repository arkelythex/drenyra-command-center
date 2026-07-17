const MEMORY_PCT_WARN = 80;
export function extractCliMemory(metadata) {
    if (!metadata || typeof metadata !== "object")
        return null;
    const snap = metadata.memorySnapshot === true;
    const mem = metadata.persistentMemory;
    const user = metadata.userContext;
    if (!snap && typeof mem !== "string" && typeof user !== "string") {
        return null;
    }
    return {
        persistentMemory: typeof mem === "string" ? mem : undefined,
        userContext: typeof user === "string" ? user : undefined,
        memoryPct: typeof metadata.memoryPct === "number" ? metadata.memoryPct : undefined,
        userPct: typeof metadata.userPct === "number" ? metadata.userPct : undefined,
    };
}
export function memoryPromptBlock(snapshot) {
    if (!snapshot)
        return "";
    const parts = [];
    if (snapshot.persistentMemory?.trim()) {
        parts.push(`[Persistent memory]\n${snapshot.persistentMemory.trim()}`);
    }
    if (snapshot.userContext?.trim()) {
        parts.push(`[User context]\n${snapshot.userContext.trim()}`);
    }
    if (parts.length === 0)
        return "";
    const warn = (snapshot.memoryPct ?? 0) >= MEMORY_PCT_WARN ||
        (snapshot.userPct ?? 0) >= MEMORY_PCT_WARN
        ? "\n(note: memory store above 80% capacity — consolidate entries in ~/.arkelythex/memories/)"
        : "";
    return `${parts.join("\n\n")}${warn}`;
}
export function enrichSummary(base, snapshot) {
    const block = memoryPromptBlock(snapshot);
    if (!block)
        return base;
    return `${base}\n\n---\n${block}`;
}
//# sourceMappingURL=memory-context.js.map