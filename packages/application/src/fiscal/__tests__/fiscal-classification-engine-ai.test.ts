/**
 * Characterization tests for FiscalClassificationEngineAI.classifyWithLLM, frozen before
 * splitting it into smaller steps. They pin the prompt assembly, the JSON parsing fallback
 * and how the AI answer is merged into the deterministic classification (incl. detracción).
 */

import type { FiscalClassification } from "@drenyra/domain/fiscal";
import { describe, expect, it } from "vitest";
import type { ClassificationInput } from "../fiscal-classification-engine";
import { FiscalClassificationEngineAI } from "../fiscal-classification-engine-ai";

const baseInput = {
	tipoComprobante: "01",
	serie: "F001",
	numero: "123",
	montoTotal: 1180,
	moneda: "PEN",
	descripcion: "Servicios legales",
	tipo: "COMPRA",
	rucEmisor: "20123456786",
	rucCliente: "10123456789",
	fechaEmision: "2026-07-15",
} as unknown as ClassificationInput;

const fallback = {
	igvTreatment: "GRAVADO",
	baseImponible: 1000,
	confidence: 0.4,
	classificationSource: "DETERMINISTIC",
	detraccion: {
		aplica: false,
		codigo: "",
		porcentaje: 0,
		monto: 0,
		estado: "NO_APLICA",
		extra: "kept",
	},
	marker: "from-fallback",
} as unknown as FiscalClassification;

const engine = new FiscalClassificationEngineAI({} as never) as any;

async function classify(
	reply: string,
	input: ClassificationInput = baseInput,
): Promise<{ result: any; prompts: { system: string; user: string }[] }> {
	const prompts: { system: string; user: string }[] = [];
	const result = await engine.classifyWithLLM(
		input,
		fallback,
		async (system: string, user: string) => {
			prompts.push({ system, user });
			return reply;
		},
	);
	return { result, prompts };
}

describe("classifyWithLLM prompt", () => {
	it.each([
		["01", "(Factura)"],
		["03", "(Boleta)"],
		["07", "(Nota de Crédito)"],
		["08", "(Nota de Débito)"],
		["99", "(99)"],
	])("labels comprobante %s as %s", async (code, label) => {
		const { prompts } = await classify("{}", {
			...baseInput,
			tipoComprobante: code,
		} as never);
		expect(prompts[0]?.user).toContain(`Tipo de comprobante: ${code} ${label}`);
	});

	it("fills every placeholder from the input", async () => {
		const { prompts } = await classify("{}");
		const user = prompts[0]?.user ?? "";
		expect(user).toContain("- Serie: F001");
		expect(user).toContain("- Número: 123");
		expect(user).toContain("- Monto total: 1180 PEN");
		expect(user).toContain("- Descripción: Servicios legales");
		expect(user).toContain("- Tipo: COMPRA (COMPRA o VENTA)");
		expect(user).toContain("- RUC emisor: 20123456786");
		expect(user).toContain("- RUC cliente: 10123456789");
		expect(user).toContain("- Fecha emisión: 2026-07-15");
		expect(user).not.toMatch(
			/\{(tipo|serie|numero|montoTotal|moneda|descripcion|rucEmisor|rucCliente|fechaEmision)/,
		);
	});

	it("uses '-' for missing numero and RUCs", async () => {
		const { prompts } = await classify("{}", {
			...baseInput,
			numero: undefined,
			rucEmisor: undefined,
			rucCliente: undefined,
		} as never);
		const user = prompts[0]?.user ?? "";
		expect(user).toContain("- Número: -\n");
		expect(user).toContain("- RUC emisor: -\n");
		expect(user).toContain("- RUC cliente: -\n");
	});

	it("sends the fiscal system prompt", async () => {
		const { prompts } = await classify("{}");
		expect(prompts[0]?.system).toContain(
			"asistente de clasificación fiscal peruano",
		);
	});
});

describe("classifyWithLLM parsing", () => {
	it("returns the deterministic fallback unchanged when the reply is not JSON", async () => {
		const { result } = await classify("not json");
		expect(result.source).toBe("DETERMINISTIC");
		expect(result.classification).toBe(fallback);
		expect(result.aiRawResponse).toBe("not json");
		expect(result.aiJustification).toBeUndefined();
	});

	it("accepts fenced JSON, case-insensitively", async () => {
		const { result } = await classify(
			'```JSON\n{"igvTreatment":"EXONERADO"}\n```',
		);
		expect(result.source).toBe("DETERMINISTIC_AI");
		expect(result.classification.igvTreatment).toBe("EXONERADO");
	});
});

describe("classifyWithLLM merge", () => {
	it("keeps the fallback IGV treatment when the AI does not give one", async () => {
		const { result } = await classify('{"justificacion":"ok"}');
		expect(result.classification.igvTreatment).toBe("GRAVADO");
		expect(result.classification.confidence).toBe(0.85);
		expect(result.classification.classificationSource).toBe("AI");
		expect(result.classification.marker).toBe("from-fallback");
		expect(result.aiJustification).toBe("ok");
		expect(result.source).toBe("DETERMINISTIC_AI");
		expect(result.aiRawResponse).toBe('{"justificacion":"ok"}');
	});

	it("defaults the justification to an empty string", async () => {
		const { result } = await classify("{}");
		expect(result.aiJustification).toBe("");
	});

	it("does not touch the fallback object", async () => {
		await classify('{"igvTreatment":"INAFECTO","detraccionAplica":true}');
		expect(fallback.igvTreatment).toBe("GRAVADO");
		expect(fallback.detraccion.aplica).toBe(false);
	});
});

describe("classifyWithLLM detracción", () => {
	it("applies code, percentage and a rounded amount when the AI flags a detracción", async () => {
		const { result } = await classify(
			'{"detraccionAplica":true,"detraccionCodigo":"020","detraccionPorcentaje":12}',
		);
		expect(result.classification.detraccion).toEqual({
			aplica: true,
			codigo: "020",
			porcentaje: 12,
			monto: 120,
			estado: "PENDIENTE",
			extra: "kept",
		});
	});

	it("rounds the amount to two decimals", async () => {
		const { result } = await classify(
			'{"detraccionAplica":true,"detraccionPorcentaje":3.3337}',
		);
		expect(result.classification.detraccion.monto).toBe(33.34);
	});

	it("falls back to 0% and an empty code when the values are missing or invalid", async () => {
		const { result } = await classify(
			'{"detraccionAplica":true,"detraccionPorcentaje":"abc"}',
		);
		expect(result.classification.detraccion).toMatchObject({
			aplica: true,
			codigo: "",
			porcentaje: 0,
			monto: 0,
		});
	});

	it("requires detraccionAplica to be the boolean true", async () => {
		for (const flag of ['"true"', "1", "false", "null"]) {
			const { result } = await classify(
				`{"detraccionAplica":${flag},"detraccionPorcentaje":10}`,
			);
			expect(result.classification.detraccion).toBe(fallback.detraccion);
		}
	});
});
