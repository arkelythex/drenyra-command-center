import { describe, expect, it } from "vitest";
import { SIRE_RULES_2026 } from "./sire.rules";
import { SOURCES_2026 } from "./sources";

function getRule(id: string) {
	const rule = SIRE_RULES_2026.find((candidate) => candidate.id === id);

	expect(rule).toBeDefined();
	return rule;
}

describe("Peru 2026 SIRE rules", () => {
	it("keeps SIRE-001 scoped to both RVIE and RCE", () => {
		const rule = getRule("SIRE-001");

		expect(rule?.summary).toContain("RVIE");
		expect(rule?.summary).toContain("RCE");
		expect(rule?.tags).toEqual(expect.arrayContaining(["rvie", "rce"]));
		expect(rule?.sources).toEqual([SOURCES_2026.sireInformationPage]);
		expect(SOURCES_2026.sireInformationPage.url).toBe(
			"https://cpe.sunat.gob.pe/node/139",
		);
		expect(SOURCES_2026.sirePortal.url).toBe("https://sire.sunat.gob.pe/");
	});

	it("sources the accept, complement, and replace functions from SUNAT", () => {
		const rule = getRule("SIRE-004");

		expect(rule?.summary).toContain("aceptarse");
		expect(rule?.summary).toContain("complementarse");
		expect(rule?.summary).toContain("reemplazarse");
		expect(rule?.sources).toEqual([SOURCES_2026.sireInformationPage]);
	});

	it("starts SIRE-002 in October 2026 only above 2,300 UIT", () => {
		const rule = getRule("SIRE-002");

		expect(rule?.effectiveFrom).toBe("2026-10-01");
		expect(rule?.summary).toContain("> 2,300 UIT");
		expect(rule?.summary).not.toContain(">= 2,300 UIT");
		expect(rule?.sources).toEqual([SOURCES_2026.sireRs1252026]);
		expect(SOURCES_2026.sireRs1252026).toEqual({
			title:
				"SUNAT - Resolución 000125-2026/SUNAT (postergación del SIRE a octubre de 2026 para PRICOS con ingresos > 2,300 UIT)",
			url: "https://www.sunat.gob.pe/legislacion/superin/2026/000125-2026.pdf",
		});
	});

	it("records the SIRE-008 transition through SLE-PLE or SLE-Portal", () => {
		const rule = getRule("SIRE-008");

		expect(rule?.effectiveFrom).toBe("2026-10-01");
		expect(rule?.summary).toContain("SLE-PLE o SLE-Portal");
		expect(rule?.summary).toContain("hasta septiembre de 2026");
		expect(rule?.summary).toContain("desde octubre de 2026");
		expect(rule?.sources).toEqual([SOURCES_2026.sireRs1252026]);
	});

	it("classifies SIRE-003 from the PRICO designation and 2024 income", () => {
		const rule = getRule("SIRE-003");

		expect(rule?.summary).toContain("31/12/2024");
		expect(rule?.summary).toContain("2024");
		expect(rule?.summary).not.toContain("31 de enero");
		expect(rule?.effectiveFrom).toBe("2026-01-01");
		expect(rule?.sources).toEqual([SOURCES_2026.sireInformationPage]);
	});

	it("retains the corrected 000392-2025 source as historical provenance", () => {
		expect(SOURCES_2026.sireRs3922025.url).toBe(
			"https://www.sunat.gob.pe/legislacion/superin/2025/000392-2025.pdf",
		);
		expect(SOURCES_2026.sireRs3922025.title).toContain(
			"postergación histórica",
		);
	});
});
