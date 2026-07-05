import { describe, expect, it } from "vitest";
import {
	FISCAL_MEMORY_ERROR_CODES,
	FiscalMemory,
	InvalidFiscalMemoryError,
} from "../index";

const baseInput = {
	id: "memory-1",
	tenantId: "tenant-1",
	companyId: "company-1",
	ruc: "20123456789",
	period: "2026-05",
	category: "tax_decision" as const,
	severity: "high" as const,
	title: "IGV credit criterion",
	summary:
		"Accountant approved IGV credit usage with supporting invoice evidence.",
	evidenceRefs: ["evidence://invoice-1"],
	tags: ["igv", "credit"],
	createdBy: "accountant-1",
	approvedBy: "controller-1",
};

describe("FiscalMemory", () => {
	it("creates a valid company-scoped fiscal memory", () => {
		const memory = FiscalMemory.create(baseInput);

		expect(memory.tenantId).toBe("tenant-1");
		expect(memory.companyId).toBe("company-1");
		expect(memory.ruc).toBe("20123456789");
		expect(memory.period).toBe("2026-05");
		expect(memory.category).toBe("tax_decision");
		expect(memory.evidenceRefs).toContain("evidence://invoice-1");
	});

	it("rejects fiscal memory without valid scope", () => {
		expect(() => FiscalMemory.create({ ...baseInput, tenantId: "" })).toThrow(
			InvalidFiscalMemoryError,
		);
	});

	it("rejects tax decisions without evidence", () => {
		try {
			FiscalMemory.create({ ...baseInput, evidenceRefs: [] });
			throw new Error("Expected fiscal memory evidence validation to fail");
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidFiscalMemoryError);
			expect((error as InvalidFiscalMemoryError).code).toBe(
				FISCAL_MEMORY_ERROR_CODES.EVIDENCE_REQUIRED,
			);
		}
	});

	it("allows client explanations without evidence", () => {
		const memory = FiscalMemory.create({
			...baseInput,
			category: "client_explanation",
			evidenceRefs: [],
			severity: "info",
		});

		expect(memory.category).toBe("client_explanation");
		expect(memory.evidenceRefs).toHaveLength(0);
	});
});
