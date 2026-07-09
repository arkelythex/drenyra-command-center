import { describe, expect, it } from "vitest";
import type { ClassificationInput } from "../fiscal-classification-engine";
import { FiscalClassificationEngine } from "../fiscal-classification-engine";

describe("FiscalClassificationEngine", () => {
	const engine = new FiscalClassificationEngine();

	function makeInput(
		overrides: Partial<ClassificationInput>,
	): ClassificationInput {
		return {
			tipoComprobante: "01",
			serie: "F001",
			numero: "1",
			montoTotal: 118.0,
			moneda: "PEN",
			descripcion: "Servicios de consultoría",
			tipo: "VENTA",
			fechaEmision: "2026-07-09",
			...overrides,
		};
	}

	it("classifies a standard taxable sale (Factura)", () => {
		const result = engine.classify(makeInput({}));

		expect(result.igvTreatment).toBe("GRAVADO");
		expect(result.igvType).toBe("DEBITO_FISCAL");
		expect(result.igvRate).toBe(18);
		expect(result.baseImponible).toBe(100.0);
		expect(result.igvAmount).toBe(18.0);
		expect(result.total).toBe(118.0);
		expect(result.sireCategory).toBe("VENTAS");
		expect(result.classificationSource).toBe("DETERMINISTIC");
	});

	it("classifies a standard taxable purchase (Factura compra)", () => {
		const result = engine.classify(
			makeInput({
				tipo: "COMPRA",
				rucEmisor: "20123456786",
			}),
		);

		expect(result.igvType).toBe("CREDITO_FISCAL");
		expect(result.sireCategory).toBe("COMPRAS");
		expect(result.baseImponible).toBe(100.0);
		expect(result.igvAmount).toBe(18.0);
	});

	it("classifies exportacion (tasa 0%)", () => {
		const result = engine.classify(
			makeInput({
				descripcion: "Venta de productos para exportación a Chile",
			}),
		);

		expect(result.igvTreatment).toBe("EXPORTACION");
		expect(result.igvAmount).toBe(0);
		expect(result.baseImponible).toBe(118.0);
	});

	it("classifies inafecto (intereses bancarios)", () => {
		const result = engine.classify(
			makeInput({
				montoTotal: 50.0,
				descripcion: "Intereses por préstamo bancario",
			}),
		);

		expect(result.igvTreatment).toBe("INAFECTO");
		expect(result.igvAmount).toBe(0);
	});

	it("classifies Boleta de Venta (03) as gravado", () => {
		const result = engine.classify(
			makeInput({
				tipoComprobante: "03",
			}),
		);

		expect(result.igvTreatment).toBe("GRAVADO");
		expect(result.sireDocumentType).toBe("03");
	});

	it("detects detracción for construction services", () => {
		const result = engine.classify(
			makeInput({
				descripcion: "Servicios de construcción de edificio comercial",
			}),
		);

		expect(result.detraccion.aplica).toBe(true);
		expect(result.detraccion.codigo).toBe("015");
		expect(result.detraccion.porcentaje).toBe(4);
		expect(result.detraccion.monto).toBeGreaterThan(0);
	});

	it("detects detracción for legal services", () => {
		const result = engine.classify(
			makeInput({
				descripcion: "Honorarios profesionales por asesoría legal",
			}),
		);

		expect(result.detraccion.aplica).toBe(true);
		expect(result.detraccion.codigo).toBe("020");
		expect(result.detraccion.porcentaje).toBe(10);
	});

	it("detects detracción for transport services", () => {
		const result = engine.classify(
			makeInput({
				descripcion: "Servicio de transporte de carga por carretera",
			}),
		);

		expect(result.detraccion.aplica).toBe(true);
		expect(result.detraccion.codigo).toBe("013");
	});

	it("returns no detracción for unrelated services", () => {
		const result = engine.classify(
			makeInput({
				descripcion: "Venta de productos electrónicos diversos",
			}),
		);

		expect(result.detraccion.aplica).toBe(false);
	});

	it("determines correct fiscal period", () => {
		const result = engine.classify(
			makeInput({
				fechaEmision: "2026-08-15",
			}),
		);

		expect(result.periodo).toBe("2026-08");
	});

	it("handles USD transactions", () => {
		const result = engine.classify(
			makeInput({
				montoTotal: 200.0,
				moneda: "USD",
			}),
		);

		expect(result.moneda).toBe("USD");
		expect(result.igvTreatment).toBe("GRAVADO");
	});

	it("classifies Nota de Crédito (07) as gravado", () => {
		const result = engine.classify(
			makeInput({
				tipoComprobante: "07",
			}),
		);

		expect(result.igvTreatment).toBe("GRAVADO");
	});

	it("high confidence for standard gravado", () => {
		const result = engine.classify(makeInput({}));

		expect(result.confidence).toBeGreaterThanOrEqual(0.9);
	});

	it("computes detracción amount correctly", () => {
		const result = engine.classify(
			makeInput({
				montoTotal: 1180.0,
				descripcion: "Servicios de consultoría legal",
			}),
		);

		// base = 1000, detracción 10% = 100
		expect(result.detraccion.aplica).toBe(true);
		expect(result.detraccion.monto).toBe(100.0);
	});
});
