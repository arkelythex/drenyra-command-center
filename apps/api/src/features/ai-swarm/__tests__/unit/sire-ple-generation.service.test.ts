import { describe, expect, it } from "vitest";
import { generateSirePleFiles } from "../../workflows/sire-ple-generation.service";

describe("generateSirePleFiles", () => {
	it("genera TXT RV/RC con estructura SUNAT (30/35 campos)", async () => {
		const result = await generateSirePleFiles({
			companyId: "cmp-1",
			period: "2026-08",
			ruc: "20123456789",
			declaredIgvPen: 180,
			salesTotalPen: 1180,
			rvieRecords: 2,
			rceRecords: 1,
		});

		const ventasDecoded = Buffer.from(
			result.files.ventas.payloadBase64,
			"base64",
		).toString("utf-8");
		const comprasDecoded = Buffer.from(
			result.files.compras.payloadBase64,
			"base64",
		).toString("utf-8");

		const firstSalesRow = ventasDecoded.split("\n")[0] ?? "";
		const firstPurchaseRow = comprasDecoded.split("\n")[0] ?? "";

		expect(firstSalesRow.split("|")).toHaveLength(30);
		expect(firstPurchaseRow.split("|")).toHaveLength(35);
		expect(result.files.ventas.recordCount).toBe(2);
		expect(result.files.compras.recordCount).toBe(1);
		expect(result.files.ventas.filename).toContain("LE20123456789202608RV.txt");
	});

	it("lanza error para periodos invalidos", async () => {
		await expect(
			generateSirePleFiles({
				companyId: "cmp-1",
				period: "2026-13",
				ruc: "20123456789",
				declaredIgvPen: 180,
				salesTotalPen: 1180,
				rvieRecords: 1,
				rceRecords: 1,
			}),
		).rejects.toThrow("Periodo invalido");
	});
});
