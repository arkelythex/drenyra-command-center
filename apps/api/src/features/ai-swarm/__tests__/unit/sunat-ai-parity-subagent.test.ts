import { describe, expect, it } from "vitest";
import type { InvoiceData } from "../../config/types";
import {
	buildSunatRagContext,
	mapParityAlertsToValidation,
	runSunatAiParitySubagent,
} from "../../rules/peru-2026";

function buildInvoice(overrides?: Partial<InvoiceData>): InvoiceData {
	return {
		id: overrides?.id ?? "INV-PARITY-001",
		ruc: overrides?.ruc ?? "20100070970",
		serie: overrides?.serie ?? "F001",
		numero: overrides?.numero ?? "00000001",
		fecha: overrides?.fecha ?? "2026-04-15",
		moneda: overrides?.moneda ?? "PEN",
		subtotal: overrides?.subtotal ?? 1000,
		igv: overrides?.igv ?? 180,
		total: overrides?.total ?? 1180,
		items: overrides?.items ?? [
			{
				descripcion: "Servicio de consultoria tributaria",
				cantidad: 1,
				precioUnitario: 1000,
				subtotal: 1000,
			},
		],
	};
}

describe("sunat-ai-parity-subagent", () => {
	it("detects predictive alerts in transition period and keeps ms target", () => {
		const result = runSunatAiParitySubagent(buildInvoice());
		const codes = new Set(result.alerts.map((alert) => alert.code));

		expect(codes.has("SUNAT_AI_DETRACCION_RISK")).toBe(true);
		expect(codes.has("SUNAT_AI_SIRE_TRANSITION")).toBe(true);
		expect(result.execution.mode).toBe("sunat-ai-parity-subagent");
		expect(result.execution.withinTarget).toBe(true);
	});

	it("raises critical IGV drift and maps it to validation error", () => {
		const result = runSunatAiParitySubagent(
			buildInvoice({
				igv: 140,
				total: 1140,
			}),
		);
		const mapped = mapParityAlertsToValidation(result.alerts);

		expect(
			mapped.errors.some((error) => error.code === "SUNAT_AI_IGV_DRIFT"),
		).toBe(true);
		expect(mapped.errors.some((error) => error.severity === "critical")).toBe(
			true,
		);
	});

	it("builds a RAG context with thresholds and source-backed rules", () => {
		const context = buildSunatRagContext(buildInvoice());

		expect(context).toContain("Contexto RAG SUNAT 2026");
		expect(context).toContain("IGV: 18%");
		expect(context).toContain("http");
	});
});
