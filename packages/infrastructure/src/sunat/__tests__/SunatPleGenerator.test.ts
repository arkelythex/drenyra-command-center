/**
 * SUNAT PLE Generator Tests
 */

import { describe, expect, it } from "vitest";
import {
	createPleGenerator,
	type PleCompraRecord,
	type PleDiarioRecord,
	type PleVentaRecord,
	SunatPleGenerator,
} from "../SunatPleGenerator";

describe("SunatPleGenerator", () => {
	const validConfig = {
		ruc: "20123456789",
		razonSocial: "EMPRESA TEST SAC",
		periodo: "202501",
		tipoLibro: "080100" as const,
	};

	describe("Configuration", () => {
		it("should create generator with valid config", () => {
			const generator = createPleGenerator(validConfig);
			expect(generator).toBeInstanceOf(SunatPleGenerator);
		});

		it("should throw error if RUC is invalid", () => {
			expect(() =>
				createPleGenerator({
					...validConfig,
					ruc: "12345", // Invalid - too short
				}),
			).toThrow("RUC debe tener 11 dígitos");
		});

		it("should throw error if periodo is invalid", () => {
			expect(() =>
				createPleGenerator({
					...validConfig,
					periodo: "2025", // Invalid - should be YYYYMM
				}),
			).toThrow("Periodo debe ser en formato YYYYMM");
		});
	});

	describe("Libro de Compras (8.1)", () => {
		it("should generate PLE file for compras", () => {
			const generator = createPleGenerator(validConfig);

			const records: PleCompraRecord[] = [
				{
					periodo: "202501",
					cuo: "202501-00001",
					correlativo: "M00001",
					fechaEmision: new Date("2025-01-15T12:00:00"), // Use noon to avoid timezone issues
					tipoComprobante: "01",
					serieComprobante: "F001",
					numeroComprobante: "00001234",
					tipoDocProveedor: "6",
					numeroDocProveedor: "20123456780",
					razonSocialProveedor: "PROVEEDOR SAC",
					baseImponible: 1000.0,
					igv: 180.0,
					montoTotal: 1180.0,
					codigoMoneda: "PEN",
					estadoOperacion: "1",
				},
			];

			const result = generator.generateLibroCompras(records);

			expect(result.success).toBe(true);
			expect(result.fileName).toContain("LE20123456789");
			expect(result.fileName).toContain("080100");
			expect(result.fileName).toMatch(/\.txt$/);
			expect(result.recordCount).toBe(1);
			expect(result.content).toContain("202501");
			expect(result.content).toContain("F001");
			expect(result.content).toContain("PROVEEDOR SAC");
			expect(result.checksum).toBeDefined();
		});

		it("should generate empty PLE file when no records", () => {
			const generator = createPleGenerator(validConfig);
			const result = generator.generateLibroCompras([]);

			expect(result.success).toBe(true);
			expect(result.fileName).toContain("080100");
			expect(result.fileName).toContain("0"); // Contains 0 for empty
			expect(result.recordCount).toBe(0);
			expect(result.content).toBe("");
		});
	});

	describe("Libro de Ventas (14.1)", () => {
		it("should generate PLE file for ventas", () => {
			const generator = createPleGenerator({
				...validConfig,
				tipoLibro: "140100",
			});

			const records: PleVentaRecord[] = [
				{
					periodo: "202501",
					cuo: "202501-00001",
					correlativo: "M00001",
					fechaEmision: new Date("2025-01-20T12:00:00"),
					tipoComprobante: "01",
					serieComprobante: "F001",
					numeroComprobante: "00005678",
					tipoDocCliente: "6",
					numeroDocCliente: "20987654321",
					razonSocialCliente: "CLIENTE SAC",
					baseImponible: 5000.0,
					igv: 900.0,
					montoTotal: 5900.0,
					codigoMoneda: "PEN",
					estadoOperacion: "1",
				},
			];

			const result = generator.generateLibroVentas(records);

			expect(result.success).toBe(true);
			expect(result.fileName).toContain("14010");
			expect(result.recordCount).toBe(1);
			expect(result.content).toContain("CLIENTE SAC");
			expect(result.content).toContain("5000.00");
		});

		it("should handle boletas with DNI", () => {
			const generator = createPleGenerator({
				...validConfig,
				tipoLibro: "140100",
			});

			const records: PleVentaRecord[] = [
				{
					periodo: "202501",
					cuo: "202501-00002",
					correlativo: "M00002",
					fechaEmision: new Date("2025-01-21T12:00:00"),
					tipoComprobante: "03", // Boleta
					serieComprobante: "B001",
					numeroComprobante: "00001000",
					tipoDocCliente: "1", // DNI
					numeroDocCliente: "12345678",
					razonSocialCliente: "JUAN PEREZ",
					baseImponible: 100.0,
					igv: 18.0,
					montoTotal: 118.0,
					codigoMoneda: "PEN",
					estadoOperacion: "1",
				},
			];

			const result = generator.generateLibroVentas(records);

			expect(result.success).toBe(true);
			expect(result.content).toContain("03"); // Tipo boleta
			expect(result.content).toContain("B001");
			expect(result.content).toContain("12345678"); // DNI
		});
	});

	describe("Libro Diario (5.1)", () => {
		it("should generate PLE file for diario", () => {
			const generator = createPleGenerator({
				...validConfig,
				tipoLibro: "050100",
			});

			const records: PleDiarioRecord[] = [
				{
					periodo: "202501",
					cuo: "202501-00001",
					correlativo: "0001",
					cuentaContable: "1041",
					tipoMoneda: "PEN",
					fechaContable: new Date("2025-01-15T12:00:00"),
					glosa: "VENTA FACTURA F001-00001234",
					debe: 1180.0,
					haber: 0.0,
					estadoOperacion: "1",
				},
				{
					periodo: "202501",
					cuo: "202501-00001",
					correlativo: "0002",
					cuentaContable: "7011",
					tipoMoneda: "PEN",
					fechaContable: new Date("2025-01-15T12:00:00"),
					glosa: "VENTA FACTURA F001-00001234",
					debe: 0.0,
					haber: 1000.0,
					estadoOperacion: "1",
				},
				{
					periodo: "202501",
					cuo: "202501-00001",
					correlativo: "0003",
					cuentaContable: "40111",
					tipoMoneda: "PEN",
					fechaContable: new Date("2025-01-15T12:00:00"),
					glosa: "IGV VENTA F001-00001234",
					debe: 0.0,
					haber: 180.0,
					estadoOperacion: "1",
				},
			];

			const result = generator.generateLibroDiario(records);

			expect(result.success).toBe(true);
			expect(result.fileName).toContain("05010");
			expect(result.recordCount).toBe(3);
			expect(result.content).toContain("1041");
			expect(result.content).toContain("7011");
			expect(result.content).toContain("40111");
		});

		it("should truncate long glosas to 200 characters", () => {
			const generator = createPleGenerator({
				...validConfig,
				tipoLibro: "050100",
			});

			const longGlosa = "A".repeat(250); // 250 characters

			const records: PleDiarioRecord[] = [
				{
					periodo: "202501",
					cuo: "202501-00001",
					correlativo: "0001",
					cuentaContable: "1041",
					tipoMoneda: "PEN",
					fechaContable: new Date("2025-01-15T12:00:00"),
					glosa: longGlosa,
					debe: 100.0,
					haber: 0.0,
					estadoOperacion: "1",
				},
			];

			const result = generator.generateLibroDiario(records);

			expect(result.success).toBe(true);
			// The glosa in content should be 200 chars max
			const lines = result.content?.split("\r\n") || [];
			const firstLine = lines[0] || "";
			expect(firstLine).not.toContain("A".repeat(250));
		});
	});

	describe("File Naming Convention", () => {
		it("should follow SUNAT naming convention with correct structure", () => {
			const generator = createPleGenerator({
				ruc: "20123456789",
				razonSocial: "TEST",
				periodo: "202503", // March 2025
				tipoLibro: "080100",
			});

			const result = generator.generateLibroCompras([
				{
					periodo: "202503",
					cuo: "202503-00001",
					correlativo: "M00001",
					fechaEmision: new Date("2025-03-15T12:00:00"),
					tipoComprobante: "01",
					serieComprobante: "F001",
					numeroComprobante: "00001",
					tipoDocProveedor: "6",
					numeroDocProveedor: "20123456780",
					razonSocialProveedor: "TEST",
					baseImponible: 100,
					igv: 18,
					montoTotal: 118,
					codigoMoneda: "PEN",
					estadoOperacion: "1",
				},
			]);

			// Expected structure: LE + RUC + YYYYMMDD + CodLibro + flags
			expect(result.fileName).toContain("LE20123456789");
			expect(result.fileName).toContain("202503");
			expect(result.fileName).toContain("080100");
			expect(result.fileName).toMatch(/\.txt$/);
		});
	});

	describe("Date Formatting", () => {
		it("should format dates correctly", () => {
			const generator = createPleGenerator(validConfig);

			const records: PleCompraRecord[] = [
				{
					periodo: "202501",
					cuo: "202501-00001",
					correlativo: "M00001",
					fechaEmision: new Date("2025-01-15T12:00:00"), // Use noon to avoid timezone
					tipoComprobante: "01",
					serieComprobante: "F001",
					numeroComprobante: "00001",
					tipoDocProveedor: "6",
					numeroDocProveedor: "20123456780",
					razonSocialProveedor: "TEST",
					baseImponible: 100,
					igv: 18,
					montoTotal: 118,
					codigoMoneda: "PEN",
					estadoOperacion: "1",
				},
			];

			const result = generator.generateLibroCompras(records);

			// Should contain a valid date format DD/MM/YYYY
			expect(result.content).toMatch(/\d{2}\/01\/2025/);
		});
	});
});
