import { describe, expect, it } from "vitest";
import {
	enrichSummary,
	extractCliMemory,
	memoryPromptBlock,
} from "../memory-context.js";

describe("memory-context", () => {
	it("extracts CLI snapshot from metadata", () => {
		const snap = extractCliMemory({
			memorySnapshot: true,
			persistentMemory: "SUNAT rules",
			userContext: "Spanish",
			memoryPct: 85,
		});
		expect(snap?.persistentMemory).toBe("SUNAT rules");
		expect(memoryPromptBlock(snap)).toContain("SUNAT rules");
		expect(memoryPromptBlock(snap)).toContain("80%");
	});

	it("enriches summary when memory present", () => {
		const out = enrichSummary("done", {
			persistentMemory: "fact",
		});
		expect(out).toContain("done");
		expect(out).toContain("fact");
	});

	it("returns base when no memory", () => {
		expect(enrichSummary("ok", null)).toBe("ok");
	});
});
