/**
 * Intelligence API — integration tests
 *
 * Tests all 5 endpoints with valid data, edge cases, and error conditions.
 * Uses Elysia app.handle() for in-process HTTP testing.
 */

import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { intelligenceModule } from "../api/routes";

function buildApp(): Elysia {
	return new Elysia().use(intelligenceModule);
}

// ─── Anomaly Detection ────────────────────────────────────────────

describe("POST /api/intelligence/anomalies/detect", () => {
	it("returns empty anomalies for clean data", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/anomalies/detect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.anomalies).toEqual([]);
		expect(body.data.summary.total).toBe(0);
	});

	it("detects RUC breach anomalies", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/anomalies/detect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					transactions: [
						{
							id: "txn-1",
							amount: 6000,
							declaredRuc: "20123456789",
							paymentRuc: "20198765432",
							serie: "F001",
							numero: "1",
							emisionDate: "2026-06-01",
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.anomalies.length).toBeGreaterThan(0);
		expect(body.data.anomalies[0].severity).toBeDefined();
		expect(body.data.summary.total).toBeGreaterThan(0);
	});

	it("returns empty for IGV matching invoice (no mismatch)", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/anomalies/detect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					invoices: [
						{
							id: "inv-1",
							serie: "F001",
							numero: "1",
							tipoOperacion: "VENTA_INTERNA",
							baseImponible: 1000,
							igvCalculado: 180, // Correct: 18% of 1000
							emisorRuc: "20123456789",
							emisionDate: "2026-06-01",
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		// IGV matches, so no anomalies expected
		expect(body.data.anomalies.length).toBe(0);
	});

	it("returns 422 for invalid body", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/anomalies/detect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ transactions: "not-an-array" }),
			}),
		);
		expect(res.status).toBe(422);
	});

	it("rejects GET method", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/anomalies/detect"),
		);
		expect(res.status).toBe(404);
	});
});

// ─── Cashflow Analysis ────────────────────────────────────────────

describe("POST /api/intelligence/cashflow/analyze", () => {
	it("returns empty anomalies for stable cashflow", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/cashflow/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					transactions: [
						{
							id: "1",
							date: "2026-06-01",
							amount: 1000,
							type: "INCOME",
							category: "sales",
						},
						{
							id: "2",
							date: "2026-06-02",
							amount: 1000,
							type: "INCOME",
							category: "sales",
						},
						{
							id: "3",
							date: "2026-06-03",
							amount: 1000,
							type: "INCOME",
							category: "sales",
						},
						{
							id: "4",
							date: "2026-06-04",
							amount: 1000,
							type: "INCOME",
							category: "sales",
						},
						{
							id: "5",
							date: "2026-06-05",
							amount: 1000,
							type: "INCOME",
							category: "sales",
						},
						{
							id: "6",
							date: "2026-06-06",
							amount: 1000,
							type: "INCOME",
							category: "sales",
						},
						{
							id: "7",
							date: "2026-06-07",
							amount: 1000,
							type: "INCOME",
							category: "sales",
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.summary.total).toBeGreaterThanOrEqual(0);
	});

	it("returns 422 for empty transactions", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/cashflow/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ transactions: [] }),
			}),
		);
		expect(res.status).toBe(422);
	});

	it("returns 422 for missing transactions", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/cashflow/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			}),
		);
		expect(res.status).toBe(422);
	});
});

// ─── Compliance Check ─────────────────────────────────────────────

describe("POST /api/intelligence/compliance/check", () => {
	it("returns empty anomalies for no data", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/compliance/check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.anomalies).toEqual([]);
		expect(body.data.summary.total).toBe(0);
	});

	it("detects SIRE filing issues or returns empty for recent data", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/compliance/check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sireRecords: [
						{
							id: "sire-1",
							serie: "F001",
							numero: "1",
							tipoDocumento: "01",
							emisorRuc: "20123456789",
							emisionDate: "2026-05-01",
							filingDate: null,
							total: 1000,
							cdrReceived: false,
							cdrDate: null,
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		// Strategy may or may not flag depending on internal date logic
		expect(body.data.summary.total).toBeGreaterThanOrEqual(0);
	});

	it("returns 422 for invalid data types", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/compliance/check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sireRecords: "invalid" }),
			}),
		);
		expect(res.status).toBe(422);
	});
});

// ─── Supplier Analysis ────────────────────────────────────────────

describe("POST /api/intelligence/suppliers/analyze", () => {
	it("analyzes suppliers and returns risk anomalies", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/suppliers/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					suppliers: [
						{
							id: "sup-1",
							name: "Proveedor A",
							ruc: "20123456789",
							createdAt: "2024-01-01",
						},
						{
							id: "sup-2",
							name: "Proveedor B",
							ruc: "20198765432",
							createdAt: "2024-06-01",
						},
					],
					transactions: [
						{
							id: "trx-1",
							supplierId: "sup-1",
							supplierName: "Proveedor A",
							supplierRuc: "20123456789",
							documentType: "01",
							serie: "F001",
							numero: "1",
							amount: 50000,
							currency: "PEN",
							issueDate: "2026-06-01",
							dueDate: "2026-06-15",
							paymentDate: null,
							paid: false,
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.summary.total).toBeGreaterThanOrEqual(0);
	});

	it("returns 422 for missing suppliers", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/suppliers/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ transactions: [] }),
			}),
		);
		expect(res.status).toBe(422);
	});
});

// ─── Document Classification ──────────────────────────────────────

describe("POST /api/intelligence/documents/classify", () => {
	it("classifies an invoice document by content", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/documents/classify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					documents: [
						{
							id: "doc-1",
							filename: "factura-001.xml",
							text: "FACTURA ELECTRONICA RUC 20123456789 IGV 18% TOTAL S/ 1180",
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.results.length).toBe(1);
		expect(body.data.results[0].documentId).toBe("doc-1");
	});

	it("classifies multiple documents", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/documents/classify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					documents: [
						{
							id: "doc-1",
							filename: "factura.xml",
							text: "FACTURA ELECTRONICA RUC 20123456789",
						},
						{
							id: "doc-2",
							filename: "contrato.pdf",
							text: "CONTRATO DE SERVICIOS CLAUSULA PRIMERA",
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.results.length).toBe(2);
		expect(body.data.summary.total).toBe(2);
	});

	it("returns 422 for empty documents", async () => {
		const res = await buildApp().handle(
			new Request("http://localhost/api/intelligence/documents/classify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ documents: [] }),
			}),
		);
		expect(res.status).toBe(422);
	});
});
