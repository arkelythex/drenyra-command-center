import { describe, expect, it } from "vitest";
import {
	fiscalMemories,
	fiscalMemoryRevisions,
} from "../schema/fiscal-memory.schema";

describe("fiscal memory schema", () => {
	it("defines fiscal memory and revision tables", () => {
		expect(fiscalMemories.id).toBeDefined();
		expect(fiscalMemories.tenantId).toBeDefined();
		expect(fiscalMemories.companyId).toBeDefined();
		expect(fiscalMemories.ruc).toBeDefined();
		expect(fiscalMemories.period).toBeDefined();
		expect(fiscalMemories.evidenceRefs).toBeDefined();
		expect(fiscalMemoryRevisions.memoryId).toBeDefined();
		expect(fiscalMemoryRevisions.previousValue).toBeDefined();
		expect(fiscalMemoryRevisions.nextValue).toBeDefined();
	});
});
