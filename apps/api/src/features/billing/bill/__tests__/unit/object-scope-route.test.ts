import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { billRoutes } from "../../api/routes";
import { BillMapper } from "../../application/bill.mapper";
import { DeleteBillCommand } from "../../application/commands/delete-bill.command";
import { BillRepository } from "../../infrastructure/bill.repository";

type BillRecord = NonNullable<Awaited<ReturnType<BillRepository["findById"]>>>;

function makeBill(overrides: Partial<BillRecord> = {}): BillRecord {
	return {
		id: "bill-1",
		companyId: "cmp-1",
		vendorId: "vendor-1",
		billNumber: "B001-0001",
		issueDate: new Date("2026-03-01T00:00:00.000Z"),
		dueDate: new Date("2026-03-10T00:00:00.000Z"),
		currency: "PEN",
		exchangeRate: 1,
		status: "DRAFT",
		notes: undefined,
		tags: [],
		items: [],
		canEdit: () => true,
		...overrides,
	} as BillRecord;
}

describe("billRoutes object scope", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("rejects cross-tenant GET before serializing the bill", async () => {
		const findByIdSpy = vi
			.spyOn(BillRepository.prototype, "findById")
			.mockResolvedValue(makeBill({ companyId: "cmp-2" }));
		const toDtoSpy = vi.spyOn(BillMapper, "toDTO");

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1", {
				method: "GET",
				headers: { "x-company-id": "cmp-1" },
			}),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
		expect(findByIdSpy).not.toHaveBeenCalled();
		expect(toDtoSpy).not.toHaveBeenCalled();
	});

	it("returns company context error when scope is missing", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue(
			makeBill(),
		);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1", {
				method: "GET",
				headers: { "x-company-id": "cmp-1" },
			}),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("rejects cross-tenant DELETE before executing the delete command", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue(
			makeBill({ companyId: "cmp-2" }),
		);
		const executeSpy = vi.spyOn(DeleteBillCommand.prototype, "execute");
		const deleteSpy = vi
			.spyOn(BillRepository.prototype, "delete")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1", {
				method: "DELETE",
				headers: { "x-company-id": "cmp-1" },
			}),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
		expect(executeSpy).not.toHaveBeenCalled();
		expect(deleteSpy).not.toHaveBeenCalled();
	});
});
