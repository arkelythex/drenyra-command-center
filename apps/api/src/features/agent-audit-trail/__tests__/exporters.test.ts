import { describe, expect, it } from "vitest";
import { exportToPdf } from "../export/pdf-exporter";
import { exportToXml } from "../export/xml-exporter";

const sampleTrail = {
	total: 1,
	logs: [
		{
			id: "01HXTEST",
			agentName: "bank-reconciliation-agent",
			decisionType: "RECONCILIATION_REVIEW",
			reasoning: "Diferencia detectada en conciliacion BCP",
			inputs: { bankCode: "BCP", expectedAmountPen: 1500 },
			outputs: { reconciledAmountPen: 1490, status: "MISMATCH" },
			hash: "a".repeat(64),
			prevHash: null,
			createdAt: new Date("2026-02-19T10:00:00.000Z"),
		},
	],
} as const;

describe("Audit Trail Exporters", () => {
	it("should export XML with escaped/cdata payloads", async () => {
		const xml = await exportToXml(sampleTrail, {
			companyRuc: "20123456789",
			companyName: "Drenyra SAC",
		});

		expect(xml).toContain("<cbc:CompanyRUC>20123456789</cbc:CompanyRUC>");
		expect(xml).toContain("<Inputs><![CDATA[{\"bankCode\":\"BCP\"");
		expect(xml).toContain("<PrevHash>GENESIS</PrevHash>");
	});

	it("should export a valid PDF binary", async () => {
		const pdf = await exportToPdf(sampleTrail, {
			companyName: "Drenyra SAC",
			companyRuc: "20123456789",
			reportDate: new Date("2026-02-19T10:00:00.000Z"),
		});

		expect(pdf.length).toBeGreaterThan(100);
		expect(pdf.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
	});
});

