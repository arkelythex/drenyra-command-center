import { describe, it, expect, beforeEach } from "vitest";
import {
	generateRecommendation,
	resetRecIdCounter,
	requiresApproval,
} from "../src/recommendation-engine";

beforeEach(() => {
	resetRecIdCounter();
});

describe("recommendation-engine", () => {
	it("generates a pending recommendation with REC-001", () => {
		const rec = generateRecommendation({
			pipelineRunId: "pipe-001",
			tipoAccion: "contabilizar-igv",
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "Contabilizar IGV por S/ 18,234.50",
			monto: 18234.5,
			confianza: 0.92,
			fuentes: [],
		});

		expect(rec.id).toBe("REC-001");
		expect(rec.status).toBe("pending");
		expect(rec.ruc).toBe("20123456789");
		expect(rec.monto).toBe(18234.5);
		expect(rec.creado).toBeDefined();
	});

	it("increments REC IDs", () => {
		const rec1 = generateRecommendation({
			pipelineRunId: "pipe-001",
			tipoAccion: "contabilizar-igv",
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "test",
			monto: 100,
			confianza: 0.9,
			fuentes: [],
		});
		const rec2 = generateRecommendation({
			pipelineRunId: "pipe-002",
			tipoAccion: "aplicar-detraccion",
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "test",
			monto: 200,
			confianza: 0.85,
			fuentes: [],
		});

		expect(rec1.id).toBe("REC-001");
		expect(rec2.id).toBe("REC-002");
	});

	it("requires approval when confidence below threshold", () => {
		const rec = generateRecommendation({
			pipelineRunId: "pipe-001",
			tipoAccion: "contabilizar-igv",
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "test",
			monto: 100,
			confianza: 0.6,
			fuentes: [],
		});

		expect(requiresApproval(rec, 0.7)).toBe(true);
		expect(requiresApproval(rec, 0.5)).toBe(false);
	});

	it("includes sources in recommendation", () => {
		const rec = generateRecommendation({
			pipelineRunId: "pipe-001",
			tipoAccion: "contabilizar-igv",
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "test",
			monto: 100,
			confianza: 0.9,
			fuentes: [
				{
					tipo: "factura-compra",
					serie: "F001",
					numero: 123,
					monto: 450,
					moneda: "PEN",
					cdrHash: "abc",
					fecha: "2026-07-05",
				},
			],
		});

		expect(rec.fuentes).toHaveLength(1);
		expect(rec.fuentes[0]!.serie).toBe("F001");
	});
});
