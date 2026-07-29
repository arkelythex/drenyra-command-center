/**
 * PLE Generator Service — Unit Tests
 *
 * Tests SUNAT TXT format generation for all four book types,
 * filename generation, and CDR hash computation.
 */
import { describe, expect, it } from "vitest";
import {
	PleGeneratorService,
	type PleGeneratorServiceConfig,
} from "../../ple-generator.service";
import type {
	PleComprasRow,
	PleLedgerRow,
	PleMayorRow,
	PleVentasRow,
} from "../../ple.types";

// ─── Helpers ───────────────────────────────────────────────────────

function createTestConfig(
	overrides?: Partial<PleGeneratorServiceConfig>,
): PleGeneratorServiceConfig {
	return {
		ruc: "20123456786",
		companyId: "test-company-id",
		period: "2026-03",
		...overrides,
	};
}

// ─── LE-DIARIO (Libro Diario) ──────────────────────────────────────

describe("PleGeneratorService — LE-DIARIO", () => {
	it("generates header with RUC and period", () => {
		const config = createTestConfig();
		const rows: PleLedgerRow[] = [];
		const result = PleGeneratorService.generateDiarioTxt(config, rows);

		expect(result).toContain("20123456786");
		expect(result).toContain("2026-03");
	});

	it("generates pipe-delimited lines for each journal entry", () => {
		const config = createTestConfig();
		const rows: PleLedgerRow[] = [
			{
				date: "2026-03-15",
				gloss: "Compra de mercadería",
				accountCode: "601100",
				debitCents: 100000,
				creditCents: 0,
			},
			{
				date: "2026-03-15",
				gloss: "Compra de mercadería",
				accountCode: "421200",
				debitCents: 0,
				creditCents: 100000,
			},
		];

		const result = PleGeneratorService.generateDiarioTxt(config, rows);

		const lines = result.split("\n").filter(Boolean);
		// Header + 2 data lines
		expect(lines.length).toBeGreaterThanOrEqual(3);

		// First data line: debe=100000, haber=0
		expect(lines[1]).toContain("2026-03-15");
		expect(lines[1]).toContain("601100");
		expect(lines[1]).toContain("1000.00");
		expect(lines[1]).toContain("0.00");

		// Second data line: debe=0, haber=100000
		expect(lines[2]).toContain("2026-03-15");
		expect(lines[2]).toContain("421200");
		expect(lines[2]).toContain("0.00");
		expect(lines[2]).toContain("1000.00");
	});

	it("converts cents to 2-decimal amounts", () => {
		const config = createTestConfig();
		const rows: PleLedgerRow[] = [
			{
				date: "2026-01-01",
				gloss: "Test",
				accountCode: "101100",
				debitCents: 12345,
				creditCents: 0,
			},
		];

		const result = PleGeneratorService.generateDiarioTxt(config, rows);

		expect(result).toContain("123.45");
		expect(result).toContain("0.00");
	});

	it("returns only header when no rows provided", () => {
		const config = createTestConfig();
		const result = PleGeneratorService.generateDiarioTxt(config, []);

		// Header line + nothing else
		const lines = result.split("\n").filter(Boolean);
		expect(lines.length).toBe(1);
		expect(result).toContain("20123456786");
	});

	it("handles special characters in glosa", () => {
		const config = createTestConfig();
		const rows: PleLedgerRow[] = [
			{
				date: "2026-03-01",
				gloss: "Factura N° 001-000123 — Servicio",
				accountCode: "631100",
				debitCents: 50000,
				creditCents: 0,
			},
		];

		const result = PleGeneratorService.generateDiarioTxt(config, rows);

		expect(result).toContain("Factura N° 001-000123 — Servicio");
	});
});

// ─── LE-MAYOR (Libro Mayor) ────────────────────────────────────────

describe("PleGeneratorService — LE-MAYOR", () => {
	it("generates header with RUC and period", () => {
		const config = createTestConfig();
		const rows: PleMayorRow[] = [];
		const result = PleGeneratorService.generateMayorTxt(config, rows);

		expect(result).toContain("20123456786");
		expect(result).toContain("2026-03");
	});

	it("aggregates account balances correctly", () => {
		const config = createTestConfig();
		const rows: PleMayorRow[] = [
			{
				accountCode: "601100",
				description: "Mercaderías",
				balanceAnteriorCents: 0,
				debitCents: 150000,
				creditCents: 0,
				balanceActualCents: 150000,
			},
		];

		const result = PleGeneratorService.generateMayorTxt(config, rows);

		expect(result).toContain("601100");
		expect(result).toContain("Mercaderías");
		expect(result).toContain("0.00"); // balance anterior
		expect(result).toContain("1500.00"); // debe
		expect(result).toContain("0.00"); // haber
		expect(result).toContain("1500.00"); // balance actual
	});

	it("handles multiple accounts", () => {
		const config = createTestConfig();
		const rows: PleMayorRow[] = [
			{
				accountCode: "101100",
				description: "Caja",
				balanceAnteriorCents: 500000,
				debitCents: 100000,
				creditCents: 20000,
				balanceActualCents: 580000,
			},
			{
				accountCode: "421200",
				description: "Proveedores",
				balanceAnteriorCents: 0,
				debitCents: 0,
				creditCents: 300000,
				balanceActualCents: -300000,
			},
		];

		const result = PleGeneratorService.generateMayorTxt(config, rows);

		const lines = result.split("\n").filter(Boolean);
		expect(lines.length).toBeGreaterThanOrEqual(3);
		expect(result).toContain("101100");
		expect(result).toContain("421200");
		expect(result).toContain("5000.00");
		expect(result).toContain("-3000.00");
	});

	it("handles zero balances", () => {
		const config = createTestConfig();
		const rows: PleMayorRow[] = [
			{
				accountCode: "999999",
				description: "Cuenta sin movimiento",
				balanceAnteriorCents: 0,
				debitCents: 0,
				creditCents: 0,
				balanceActualCents: 0,
			},
		];

		const result = PleGeneratorService.generateMayorTxt(config, rows);

		const lines = result.split("\n").filter(Boolean);
		expect(lines.length).toBeGreaterThanOrEqual(2);
		// All amounts should be "0.00"
		expect(result).toContain("0.00");
	});
});

// ─── LE-COMPRAS (Registro de Compras) ──────────────────────────────

describe("PleGeneratorService — LE-COMPRAS", () => {
	it("generates header with RUC and period", () => {
		const config = createTestConfig();
		const rows: PleComprasRow[] = [];
		const result = PleGeneratorService.generateComprasTxt(config, rows);

		expect(result).toContain("20123456786");
		expect(result).toContain("2026-03");
	});

	it("generates pipe-delimited purchase register lines", () => {
		const config = createTestConfig();
		const rows: PleComprasRow[] = [
			{
				rucProveedor: "20100066613",
				razonSocial: "PROVEEDOR SAC",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00001234",
				fecha: "2026-03-15",
				baseCents: 100000,
				igvCents: 18000,
				totalCents: 118000,
			},
		];

		const result = PleGeneratorService.generateComprasTxt(config, rows);

		expect(result).toContain("20100066613");
		expect(result).toContain("PROVEEDOR SAC");
		expect(result).toContain("01");
		expect(result).toContain("F001");
		expect(result).toContain("00001234");
		expect(result).toContain("2026-03-15");
		expect(result).toContain("1000.00");
		expect(result).toContain("180.00");
		expect(result).toContain("1180.00");
	});

	it("handles multiple purchase records", () => {
		const config = createTestConfig();
		const rows: PleComprasRow[] = [
			{
				rucProveedor: "20100066613",
				razonSocial: "PROVEEDOR A",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00000001",
				fecha: "2026-03-10",
				baseCents: 50000,
				igvCents: 9000,
				totalCents: 59000,
			},
			{
				rucProveedor: "20512345678",
				razonSocial: "PROVEEDOR B",
				tipoComprobante: "01",
				serie: "F002",
				numero: "00000002",
				fecha: "2026-03-20",
				baseCents: 200000,
				igvCents: 36000,
				totalCents: 236000,
			},
		];

		const result = PleGeneratorService.generateComprasTxt(config, rows);

		const lines = result.split("\n").filter(Boolean);
		expect(lines.length).toBeGreaterThanOrEqual(3);
		expect(result).toContain("PROVEEDOR A");
		expect(result).toContain("PROVEEDOR B");
	});

	it("handles RUC with leading zeros", () => {
		const config = createTestConfig();
		const rows: PleComprasRow[] = [
			{
				rucProveedor: "10012345678",
				razonSocial: "PERSONA NATURAL",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00000001",
				fecha: "2026-03-01",
				baseCents: 10000,
				igvCents: 1800,
				totalCents: 11800,
			},
		];

		const result = PleGeneratorService.generateComprasTxt(config, rows);

		expect(result).toContain("10012345678");
	});
});

// ─── LE-VENTAS (Registro de Ventas) ────────────────────────────────

describe("PleGeneratorService — LE-VENTAS", () => {
	it("generates header with RUC and period", () => {
		const config = createTestConfig();
		const rows: PleVentasRow[] = [];
		const result = PleGeneratorService.generateVentasTxt(config, rows);

		expect(result).toContain("20123456786");
		expect(result).toContain("2026-03");
	});

	it("generates pipe-delimited sales register lines", () => {
		const config = createTestConfig();
		const rows: PleVentasRow[] = [
			{
				rucCliente: "20100066613",
				razonSocial: "CLIENTE SAC",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00005678",
				fecha: "2026-03-15",
				baseCents: 200000,
				igvCents: 36000,
				totalCents: 236000,
			},
		];

		const result = PleGeneratorService.generateVentasTxt(config, rows);

		expect(result).toContain("20100066613");
		expect(result).toContain("CLIENTE SAC");
		expect(result).toContain("01");
		expect(result).toContain("F001");
		expect(result).toContain("00005678");
		expect(result).toContain("2026-03-15");
		expect(result).toContain("2000.00");
		expect(result).toContain("360.00");
		expect(result).toContain("2360.00");
	});

	it("handles multiple sales records", () => {
		const config = createTestConfig();
		const rows: PleVentasRow[] = [
			{
				rucCliente: "20100066613",
				razonSocial: "CLIENTE A",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00000010",
				fecha: "2026-03-05",
				baseCents: 150000,
				igvCents: 27000,
				totalCents: 177000,
			},
			{
				rucCliente: "20587654321",
				razonSocial: "CLIENTE B EIRL",
				tipoComprobante: "01",
				serie: "F001",
				numero: "00000011",
				fecha: "2026-03-25",
				baseCents: 350000,
				igvCents: 63000,
				totalCents: 413000,
			},
		];

		const result = PleGeneratorService.generateVentasTxt(config, rows);

		const lines = result.split("\n").filter(Boolean);
		expect(lines.length).toBeGreaterThanOrEqual(3);
		expect(result).toContain("CLIENTE A");
		expect(result).toContain("CLIENTE B EIRL");
	});
});

// ─── Filename Generation ────────────────────────────────────────────

describe("PleGeneratorService — generateFileName", () => {
	it("generates SUNAT-compliant filename for LE-DIARIO", () => {
		const filename = PleGeneratorService.generateFileName(
			"20123456786",
			"2026-03",
			"LE-DIARIO",
		);

		expect(filename.filename).toBe("20123456786-202603-LE-DIARIO.txt");
		expect(filename.ruc).toBe("20123456786");
		expect(filename.period).toBe("2026-03");
		expect(filename.bookType).toBe("LE-DIARIO");
	});

	it("generates correct filename for LE-MAYOR", () => {
		const filename = PleGeneratorService.generateFileName(
			"20123456786",
			"2026-03",
			"LE-MAYOR",
		);

		expect(filename.filename).toBe("20123456786-202603-LE-MAYOR.txt");
	});

	it("generates correct filename for LE-COMPRAS", () => {
		const filename = PleGeneratorService.generateFileName(
			"20123456786",
			"2026-03",
			"LE-COMPRAS",
		);

		expect(filename.filename).toBe("20123456786-202603-LE-COMPRAS.txt");
	});

	it("generates correct filename for LE-VENTAS", () => {
		const filename = PleGeneratorService.generateFileName(
			"20123456786",
			"2026-03",
			"LE-VENTAS",
		);

		expect(filename.filename).toBe("20123456786-202603-LE-VENTAS.txt");
	});

	it("removes hyphens from period for filename", () => {
		const filename = PleGeneratorService.generateFileName(
			"20123456786",
			"2026-12",
			"LE-DIARIO",
		);

		expect(filename.filename).toBe("20123456786-202612-LE-DIARIO.txt");
	});
});

// ─── CDR Hash ──────────────────────────────────────────────────────

describe("PleGeneratorService — generateCdrHash", () => {
	it("generates a SHA-256 hex hash", () => {
		const hash = PleGeneratorService.generateCdrHash("test content");

		expect(hash).toHaveLength(64);
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it("produces deterministic output for same input", () => {
		const content = "PLE content for hashing";
		const hash1 = PleGeneratorService.generateCdrHash(content);
		const hash2 = PleGeneratorService.generateCdrHash(content);

		expect(hash1).toBe(hash2);
	});

	it("produces different hashes for different content", () => {
		const hash1 = PleGeneratorService.generateCdrHash("content A");
		const hash2 = PleGeneratorService.generateCdrHash("content B");

		expect(hash1).not.toBe(hash2);
	});

	it("handles empty content", () => {
		const hash = PleGeneratorService.generateCdrHash("");

		expect(hash).toHaveLength(64);
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it("handles multi-line content", () => {
		const content = "line1\nline2\nline3\n";
		const hash = PleGeneratorService.generateCdrHash(content);

		expect(hash).toHaveLength(64);
	});
});

// ─── Generator Selection ───────────────────────────────────────────

describe("PleGeneratorService — generateBook", () => {
	it("routes LE-DIARIO to the diario generator", () => {
		const config = createTestConfig();
		const rows: PleLedgerRow[] = [
			{
				date: "2026-03-01",
				gloss: "Test",
				accountCode: "601100",
				debitCents: 10000,
				creditCents: 0,
			},
		];

		const result = PleGeneratorService.generateBook(config, "LE-DIARIO", rows);

		expect(result).toContain("20123456786");
		expect(result).toContain("LE-DIARIO");
	});

	it("routes LE-MAYOR to the mayor generator", () => {
		const config = createTestConfig();
		const rows: PleMayorRow[] = [
			{
				accountCode: "101100",
				description: "Caja",
				balanceAnteriorCents: 0,
				debitCents: 10000,
				creditCents: 0,
				balanceActualCents: 10000,
			},
		];

		const result = PleGeneratorService.generateBook(config, "LE-MAYOR", rows);

		expect(result).toContain("20123456786");
		expect(result).toContain("LE-MAYOR");
	});

	it("throws for unsupported book type", () => {
		const config = createTestConfig();

		expect(() =>
			PleGeneratorService.generateBook(
				config,
				"LE-DIARIO",
				[] as PleLedgerRow[],
			),
		).not.toThrow();

		// Using a non-existent book type should throw
		expect(() =>
			PleGeneratorService.generateBook(config, "INVALID" as never, []),
		).toThrow(/book type/i);
	});
});
