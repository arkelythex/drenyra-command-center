import { describe, expect, it } from "vitest";
import { buildSheetDiffArtifactFromInput } from "../sheet-diff-builder";

describe("buildSheetDiffArtifactFromInput", () => {
	it("builds a sheet_diff artifact from CSV input", async () => {
		const csv = [
			"serie,numero,ruc,total,igv",
			"F001,101,20100070970,118.01,18.00",
			"F001,102,20100070970,236.00,36.00",
		].join("\n");
		const file = new File([csv], "ventas.csv", { type: "text/csv" });

		const artifact = await buildSheetDiffArtifactFromInput({
			content: "Conciliar mes de febrero",
			files: [file],
		});

		expect(artifact?.type).toBe("sheet_diff");
		expect(artifact?.payload.rows.length).toBeGreaterThan(0);
		expect(artifact?.payload.sourceName).toBe("ventas.csv");
	});

	it("returns fallback sheet_diff when prompt asks for SIRE without file", async () => {
		const artifact = await buildSheetDiffArtifactFromInput({
			content: "Necesito conciliar SIRE del mes pasado",
		});

		expect(artifact?.type).toBe("sheet_diff");
		expect(artifact?.payload.summary.total).toBeGreaterThan(0);
	});

	it("returns null when input is unrelated to spreadsheet flow", async () => {
		const artifact = await buildSheetDiffArtifactFromInput({
			content: "explica mi ratio de liquidez",
		});

		expect(artifact).toBeNull();
	});
});
