import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const eq = vi.fn((column, value) => ({ column, value }));
const desc = vi.fn((column) => ({ desc: column }));

vi.mock("@drenyra/persistence/client", () => ({ db: { query: { detractions: { findMany } } } }));
vi.mock("@drenyra/persistence/query", () => ({ eq, desc }));
vi.mock("@drenyra/persistence/schema", () => ({ detractions: { companyId: "companyId", status: "status", createdAt: "createdAt" } }));

import { listDetractions } from "../../application/queries/list-detractions.query";
import { DetractionItemSchema, ListDetractionsQuerySchema, ListDetractionsResponseSchema } from "../../detractions.schemas";

describe("detractions", () => {
	beforeEach(() => { vi.clearAllMocks(); findMany.mockResolvedValue([]); });

	it("maps database dates to ISO strings", async () => {
		findMany.mockResolvedValue([{ id: "d-1", reference: "F001-1", spotCode: "022", percentage: 12, amountCents: 1200, status: "pendiente", createdAt: new Date("2026-01-01T00:00:00.000Z") }]);
		await expect(listDetractions({})).resolves.toEqual([{ id: "d-1", reference: "F001-1", spotCode: "022", percentage: 12, amountCents: 1200, status: "pendiente", createdAt: "2026-01-01T00:00:00.000Z" }]);
	});

	it("limits list results to one hundred and sorts by creation date", async () => {
		await listDetractions({});
		expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 100, orderBy: [{ desc: "createdAt" }] }));
	});

	it("adds the company filter when supplied", async () => {
		await listDetractions({ companyId: "company-1" });
		expect(eq).toHaveBeenCalledWith("companyId", "company-1");
	});

	it("adds the status filter when supplied", async () => {
		await listDetractions({ status: "depositado" });
		expect(eq).toHaveBeenCalledWith("status", "depositado");
	});

	it("accepts valid API query and response contracts", () => {
		expect(ListDetractionsQuerySchema.parse({ companyId: "47ab7ee0-6778-4cc3-a7de-9e93d57d95bc", status: "usado" })).toMatchObject({ status: "usado" });
		expect(ListDetractionsResponseSchema.parse([DetractionItemSchema.parse({ id: "d-1", reference: "F001", spotCode: "022", percentage: 12, amountCents: 1, status: "usado", createdAt: "2026-01-01" })])).toHaveLength(1);
	});

	it("rejects unsupported detraction statuses", () => {
		expect(() => ListDetractionsQuerySchema.parse({ status: "invalid" })).toThrow();
	});
});
