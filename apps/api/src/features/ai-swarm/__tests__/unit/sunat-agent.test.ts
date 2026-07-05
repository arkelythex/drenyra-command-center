/**
 * SUNAT Agent Reliability Tests
 *
 * Focus:
 * - deterministic rule validation (no paid network calls)
 * - 100 edge cases for SIRE/SUNAT validator behavior
 *
 * @module ai-swarm/__tests__
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InvoiceData } from "../../config/types";

vi.mock("../../config/openrouter.config", async () => {
	const actual = await vi.importActual<
		typeof import("../../config/openrouter.config")
	>("../../config/openrouter.config");

	return {
		...actual,
		hasOpenRouterKey: () => false,
	};
});

import { SUNATAgent } from "../../agents/sunat.agent";

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

function buildBaseInvoice(partial?: Partial<InvoiceData>): InvoiceData {
	return {
		id: partial?.id ?? "INV-BASE-001",
		ruc: partial?.ruc ?? "20100070970",
		serie: partial?.serie ?? "F001",
		numero: partial?.numero ?? "00000001",
		fecha: partial?.fecha ?? "2026-02-18",
		moneda: partial?.moneda ?? "PEN",
		subtotal: partial?.subtotal ?? 100,
		igv: partial?.igv ?? 18,
		total: partial?.total ?? 118,
		items: partial?.items ?? [
			{
				descripcion: "Servicio de consultoria",
				cantidad: 1,
				precioUnitario: partial?.subtotal ?? 100,
				subtotal: partial?.subtotal ?? 100,
			},
		],
	};
}

type EdgeCase = {
	name: string;
	invoice: InvoiceData;
	expectedErrorCodes: Array<
		"INVALID_RUC" | "INVALID_IGV" | "INVALID_TOTAL" | "INVALID_SERIE_FORMAT"
	>;
};

describe("SUNATAgent", () => {
	let agent: SUNATAgent;

	beforeEach(() => {
		agent = new SUNATAgent();
	});

	it("validates a correct invoice without rule errors", async () => {
		const result = await agent.validateInvoice(buildBaseInvoice());

		expect(result.success).toBe(true);
		expect(result.metadata.agentType).toBe("sunat");
		expect(result.data?.isValid).toBe(true);
		expect(result.data?.errors).toHaveLength(0);
	});

	it("accepts rounding tolerance just below S/ 0.02 (IGV and total)", async () => {
		const subtotal = 333.33;
		const expectedIgv = round2(subtotal * 0.18);
		const igv = expectedIgv + 0.019;
		const expectedTotal = subtotal + igv;
		const total = expectedTotal - 0.019;

		const result = await agent.validateInvoice(
			buildBaseInvoice({
				id: "INV-TOLERANCE-001",
				subtotal,
				igv,
				total,
			}),
		);

		const errorCodes = new Set(result.data?.errors.map((error) => error.code));
		expect(errorCodes.has("INVALID_IGV")).toBe(false);
		expect(errorCodes.has("INVALID_TOTAL")).toBe(false);
	});

	it("covers 100 edge cases for fiscal validator reliability", async () => {
		const igvCases: EdgeCase[] = Array.from({ length: 60 }, (_, index) => {
			const subtotal = round2(75 + index * 11.37);
			const expectedIgv = round2(subtotal * 0.18);
			const igv = round2(expectedIgv + (index % 2 === 0 ? 0.03 : -0.03));

			return {
				name: `igv-drift-${index + 1}`,
				invoice: buildBaseInvoice({
					id: `INV-IGV-${index + 1}`,
					subtotal,
					igv,
					total: round2(subtotal + igv),
				}),
				expectedErrorCodes: ["INVALID_IGV"],
			};
		});

		const totalCases: EdgeCase[] = Array.from({ length: 20 }, (_, index) => {
			const subtotal = round2(140 + index * 19.41);
			const igv = round2(subtotal * 0.18);
			const expectedTotal = round2(subtotal + igv);
			const total = round2(expectedTotal + (index % 2 === 0 ? 0.03 : -0.03));

			return {
				name: `total-drift-${index + 1}`,
				invoice: buildBaseInvoice({
					id: `INV-TOTAL-${index + 1}`,
					subtotal,
					igv,
					total,
				}),
				expectedErrorCodes: ["INVALID_TOTAL"],
			};
		});

		const invalidRucCases: EdgeCase[] = [
			"20100070971",
			"20100070972",
			"20100070973",
			"20100070974",
			"20100070975",
			"20100070976",
			"20100070977",
			"20100070978",
			"20100070979",
			"12345678901",
		].map((ruc, index) => ({
			name: `invalid-ruc-${index + 1}`,
			invoice: buildBaseInvoice({
				id: `INV-RUC-${index + 1}`,
				ruc,
			}),
			expectedErrorCodes: ["INVALID_RUC"],
		}));

		const invalidSerieCases: EdgeCase[] = [
			{ serie: "ABC1", numero: "00000001" },
			{ serie: "F01", numero: "00000001" },
			{ serie: "F0001", numero: "00000001" },
			{ serie: "X001", numero: "00000001" },
			{ serie: "B01A", numero: "00000001" },
			{ serie: "f001", numero: "00000001" },
			{ serie: "F001", numero: "123" },
			{ serie: "F001", numero: "0001A001" },
			{ serie: "F001-", numero: "00000001" },
			{ serie: "", numero: "00000001" },
		].map((format, index) => ({
			name: `invalid-serie-${index + 1}`,
			invoice: buildBaseInvoice({
				id: `INV-SERIE-${index + 1}`,
				serie: format.serie,
				numero: format.numero,
			}),
			expectedErrorCodes: ["INVALID_SERIE_FORMAT"],
		}));

		const edgeCases = [
			...igvCases,
			...totalCases,
			...invalidRucCases,
			...invalidSerieCases,
		];
		expect(edgeCases).toHaveLength(100);

		const results = await Promise.all(
			edgeCases.map(async (edgeCase) => {
				const result = await agent.validateInvoice(edgeCase.invoice);
				const errorCodes = new Set(
					result.data?.errors.map((error) => error.code),
				);

				return { edgeCase, errorCodes };
			}),
		);

		const failures = results.filter(({ edgeCase, errorCodes }) =>
			edgeCase.expectedErrorCodes.some((code) => !errorCodes.has(code)),
		);

		expect(failures).toHaveLength(0);
	});

	it("keeps false positives under 1% for 100 valid invoices", async () => {
		const validCases: InvoiceData[] = Array.from(
			{ length: 100 },
			(_, index) => {
				const subtotal = round2(100 + index * 9.73);
				const igv = round2(subtotal * 0.18);
				const total = round2(subtotal + igv);

				return buildBaseInvoice({
					id: `INV-VALID-${index + 1}`,
					subtotal,
					igv,
					total,
					serie: index % 2 === 0 ? "F001" : "B001",
					numero: `${index + 1}`.padStart(8, "0"),
				});
			},
		);

		const results = await Promise.all(
			validCases.map((invoice) => agent.validateInvoice(invoice)),
		);
		const falsePositives = results.filter(
			(result) => !result.data?.isValid,
		).length;
		const falsePositiveRate = falsePositives / validCases.length;

		expect(falsePositiveRate).toBeLessThan(0.01);
		expect(falsePositives).toBe(0);
	});
});
