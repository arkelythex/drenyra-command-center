import { describe, expect, it } from "vitest";
import {
	DetractionItemSchema,
	ListDetractionsQuerySchema,
	ListDetractionsResponseSchema,
} from "../../detractions.schemas";

const item = {
	id: "detraction-1",
	reference: "F001-1",
	spotCode: "001",
	percentage: 12,
	amountCents: 1200,
	status: "pendiente",
	createdAt: "2026-01-01T00:00:00.000Z",
};

describe("detractions schemas", () => {
	it("accepts a complete detraction item", () => {
		expect(DetractionItemSchema.parse(item)).toEqual(item);
	});

	it("rejects an unsupported detraction status", () => {
		expect(() => DetractionItemSchema.parse({ ...item, status: "invalid" })).toThrow();
	});

	it("requires numeric monetary values", () => {
		expect(() => DetractionItemSchema.parse({ ...item, amountCents: "1200" })).toThrow();
	});

	it("accepts an empty list query", () => {
		expect(ListDetractionsQuerySchema.parse({})).toEqual({});
	});

	it("rejects a malformed company id in list queries", () => {
		expect(() => ListDetractionsQuerySchema.parse({ companyId: "not-a-uuid" })).toThrow();
	});

	it("accepts a response containing validated items", () => {
		expect(ListDetractionsResponseSchema.parse([item])).toEqual([item]);
	});
});
