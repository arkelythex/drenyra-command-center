/**
 * Unit Tests for DocumentSeries Value Object
 */

import { describe, expect, it } from "vitest";
import { InvalidDocumentSeriesError } from "../../errors/InvalidDocumentSeriesError";
import { DocumentSeries } from "../DocumentSeries";

describe("DocumentSeries Value Object", () => {
	describe("Creation", () => {
		it("should create valid Factura series", () => {
			const series = DocumentSeries.create("F001");
			expect(series.toString()).toBe("F001");
			expect(series.getDocumentType()).toBe("FACTURA");
		});

		it("should create valid Boleta series", () => {
			const series = DocumentSeries.create("B001");
			expect(series.toString()).toBe("B001");
			expect(series.getDocumentType()).toBe("BOLETA");
		});

		it("should create valid Credit Note series", () => {
			const seriesFC = DocumentSeries.create("FC01");
			expect(seriesFC.getDocumentType()).toBe("NOTA_CREDITO_FACTURA");

			const seriesBC = DocumentSeries.create("BC01");
			expect(seriesBC.getDocumentType()).toBe("NOTA_CREDITO_BOLETA");
		});

		it("should create valid Debit Note series", () => {
			const seriesFD = DocumentSeries.create("FD01");
			expect(seriesFD.getDocumentType()).toBe("NOTA_DEBITO_FACTURA");

			const seriesBD = DocumentSeries.create("BD01");
			expect(seriesBD.getDocumentType()).toBe("NOTA_DEBITO_BOLETA");
		});

		it("should convert to uppercase", () => {
			const series = DocumentSeries.create("f001");
			expect(series.toString()).toBe("F001");
		});

		it("should trim whitespace", () => {
			const series = DocumentSeries.create("  F001  ");
			expect(series.toString()).toBe("F001");
		});

		it("should throw error for invalid format", () => {
			expect(() => DocumentSeries.create("X001")).toThrow(
				InvalidDocumentSeriesError,
			);
			expect(() => DocumentSeries.create("F01")).toThrow(
				InvalidDocumentSeriesError,
			);
			expect(() => DocumentSeries.create("F0001")).toThrow(
				InvalidDocumentSeriesError,
			);
			expect(() => DocumentSeries.create("FABC")).toThrow(
				InvalidDocumentSeriesError,
			);
		});
	});

	describe("Document Type Detection", () => {
		it("should detect Factura", () => {
			const series = DocumentSeries.create("F001");
			expect(series.isFactura()).toBe(true);
			expect(series.isBoleta()).toBe(false);
			expect(series.isCreditNote()).toBe(false);
			expect(series.isDebitNote()).toBe(false);
		});

		it("should detect Boleta", () => {
			const series = DocumentSeries.create("B001");
			expect(series.isBoleta()).toBe(true);
			expect(series.isFactura()).toBe(false);
		});

		it("should detect Credit Note", () => {
			const seriesFC = DocumentSeries.create("FC01");
			expect(seriesFC.isCreditNote()).toBe(true);
			expect(seriesFC.isDebitNote()).toBe(false);

			const seriesBC = DocumentSeries.create("BC01");
			expect(seriesBC.isCreditNote()).toBe(true);
		});

		it("should detect Debit Note", () => {
			const seriesFD = DocumentSeries.create("FD01");
			expect(seriesFD.isDebitNote()).toBe(true);
			expect(seriesFD.isCreditNote()).toBe(false);

			const seriesBD = DocumentSeries.create("BD01");
			expect(seriesBD.isDebitNote()).toBe(true);
		});
	});

	describe("Component Extraction", () => {
		it("should extract numeric part", () => {
			const series = DocumentSeries.create("F001");
			expect(series.getNumericPart()).toBe(1);

			const series2 = DocumentSeries.create("B123");
			expect(series2.getNumericPart()).toBe(123);
		});

		it("should extract prefix", () => {
			const series = DocumentSeries.create("F001");
			expect(series.getPrefix()).toBe("F");

			const series2 = DocumentSeries.create("FC01");
			expect(series2.getPrefix()).toBe("FC");
		});
	});

	describe("Equality", () => {
		it("should be equal to series with same value", () => {
			const series1 = DocumentSeries.create("F001");
			const series2 = DocumentSeries.create("F001");
			expect(series1.equals(series2)).toBe(true);
		});

		it("should not be equal to series with different value", () => {
			const series1 = DocumentSeries.create("F001");
			const series2 = DocumentSeries.create("F002");
			expect(series1.equals(series2)).toBe(false);
		});

		it("should handle null/undefined comparison", () => {
			const series = DocumentSeries.create("F001");
			expect(series.equals(null)).toBe(false);
			expect(series.equals(undefined)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const series = DocumentSeries.create("F001");
			const json = series.toJSON();

			expect(json).toEqual({
				value: "F001",
				documentType: "FACTURA",
			});
		});

		it("should deserialize from JSON", () => {
			const json = { value: "F001" };
			const series = DocumentSeries.fromJSON(json);

			expect(series.toString()).toBe("F001");
			expect(series.getDocumentType()).toBe("FACTURA");
		});
	});

	describe("Immutability", () => {
		it("should be immutable", () => {
			const series = DocumentSeries.create("F001");

			expect(() => {
				// @ts-expect-error - trying to mutate
				series.value = "F002";
			}).toThrow();
		});
	});

	describe("Real Examples", () => {
		const validSeries = [
			"F001",
			"F999",
			"B001",
			"B123",
			"FC01",
			"BC01",
			"FD01",
			"BD01",
		];

		validSeries.forEach((seriesValue) => {
			it(`should accept valid series: ${seriesValue}`, () => {
				expect(() => DocumentSeries.create(seriesValue)).not.toThrow();
			});
		});
	});
});
