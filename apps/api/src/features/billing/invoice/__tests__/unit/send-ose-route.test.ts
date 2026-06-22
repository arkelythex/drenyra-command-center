import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElectronicInvoicingService } from "../../../../../services/electronic-invoicing.service";
import { invoiceRoutes } from "../../api/routes";
import { GetInvoiceQuery } from "../../application/queries/get-invoice.query";

describe("invoice send-ose route", () => {
	const app = new Elysia().use(invoiceRoutes);
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = {
			...originalEnv,
			COMPANY_RUC: "20100070970",
			COMPANY_NAME: "ARKELYTHEX S.A.C.",
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("returns company context error when send-ose route is called without valid company scope", async () => {
		vi.spyOn(GetInvoiceQuery.prototype, "execute").mockResolvedValue({
			id: "inv-1",
			companyId: "cmp-1",
			customerId: "customer-1",
			series: "F001",
			correlative: 1,
			invoiceNumber: "F001-00000001",
			issueDate: new Date("2026-02-20T00:00:00.000Z"),
			dueDate: new Date("2026-02-28T00:00:00.000Z"),
			currency: "PEN",
			items: [],
			status: "DRAFT",
		} as never);
		const processSpy = vi.spyOn(
			ElectronicInvoicingService,
			"processElectronicInvoice",
		);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/send-ose", {
				method: "POST",
			}),
		);

		expect(response.status).toBe(400);
		expect(processSpy).not.toHaveBeenCalled();
		const payload = await response.json();
		expect(payload).toEqual({
			success: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("returns company context error when scope cannot be resolved with header", async () => {
		vi.spyOn(GetInvoiceQuery.prototype, "execute").mockResolvedValue({
			id: "inv-1",
			companyId: "cmp-1",
			customerId: "customer-1",
			series: "F001",
			correlative: 1,
			invoiceNumber: "F001-00000001",
			issueDate: new Date("2026-02-20T00:00:00.000Z"),
			dueDate: new Date("2026-02-28T00:00:00.000Z"),
			currency: "PEN",
			items: [],
			status: "DRAFT",
		} as never);
		const processSpy = vi.spyOn(
			ElectronicInvoicingService,
			"processElectronicInvoice",
		);

		const response = await app.handle(
			new Request("http://localhost/api/invoices/inv-1/send-ose", {
				method: "POST",
				headers: {
					"x-company-id": "cmp-other",
				},
			}),
		);

		expect(response.status).toBe(400);
		expect(processSpy).not.toHaveBeenCalled();
		const payload = await response.json();
		expect(payload).toEqual({
			success: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});
});
