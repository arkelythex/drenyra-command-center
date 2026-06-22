import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../../../auth/auth.config";
import { billRoutes } from "../../api/routes";
import { BillMapper } from "../../application/bill.mapper";
import { BillRepository } from "../../infrastructure/bill.repository";

type BillRecord = NonNullable<Awaited<ReturnType<BillRepository["findById"]>>>;

describe("billRoutes pay route", () => {
	beforeEach(() => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-usr-1",
				legacyUserId: "usr-1",
				role: "owner",
				activeCompanyId: "cmp-1",
			},
		} as never);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("applies a payment using the resolved legacy actor identity", async () => {
		vi.spyOn(BillRepository.prototype, "findById")
			.mockResolvedValueOnce({
				id: "bill-1",
				companyId: "cmp-1",
				status: "OVERDUE",
				currency: "PEN",
				notes: undefined,
				applyPayment: () => ({
					id: "bill-1",
					companyId: "cmp-1",
					status: "PAID",
					currency: "PEN",
					notes: "",
				}),
			} as unknown as BillRecord)
			.mockResolvedValueOnce({
				id: "bill-1",
				companyId: "cmp-1",
				status: "OVERDUE",
				currency: "PEN",
				notes: undefined,
				applyPayment: () => ({
					id: "bill-1",
					companyId: "cmp-1",
					status: "PAID",
					currency: "PEN",
					notes: "",
				}),
			} as unknown as BillRecord)
			.mockResolvedValueOnce({
				id: "bill-1",
				companyId: "cmp-1",
				status: "PAID",
				currency: "PEN",
				notes: "",
			} as unknown as BillRecord);
		vi.spyOn(BillRepository.prototype, "updateStatus").mockResolvedValue(
			undefined,
		);
		vi.spyOn(BillMapper, "toDTO").mockReturnValue({
			id: "bill-1",
			companyId: "cmp-1",
			vendorId: "vendor-1",
			billNumber: "B001-0001",
			issueDate: new Date("2026-03-01T00:00:00.000Z"),
			dueDate: new Date("2026-03-10T00:00:00.000Z"),
			currency: "PEN",
			exchangeRate: 1,
			status: "PAID",
			subtotal: { amount: "84.75", currency: "PEN" },
			igvAmount: { amount: "15.25", currency: "PEN" },
			totalAmount: { amount: "100.00", currency: "PEN" },
			balanceDue: { amount: "0.00", currency: "PEN" },
			items: [],
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-10T00:00:00.000Z"),
		});

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1/pay", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({
					amount: "100.00",
					currency: "PEN",
					actorName: "QA User",
				}),
			}),
		);

		expect(response.status).toBe(200);
	});

	it("rejects a pay request when the tenant scope does not match the bill", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue({
			id: "bill-1",
			companyId: "cmp-2",
			status: "OVERDUE",
		} as BillRecord);
		const updateStatusSpy = vi
			.spyOn(BillRepository.prototype, "updateStatus")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1/pay", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({
					amount: "100.00",
					currency: "PEN",
				}),
			}),
		);

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "TENANT_SCOPE_VIOLATION",
		});
		expect(updateStatusSpy).not.toHaveBeenCalled();
	});

	it("denies spoofable header-only context on pay route", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue({
			id: "bill-1",
			companyId: "cmp-1",
			status: "OVERDUE",
		} as BillRecord);
		const updateStatusSpy = vi.spyOn(BillRepository.prototype, "updateStatus");

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1/pay", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({
					amount: "100.00",
					currency: "PEN",
				}),
			}),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "SESSION_REQUIRED",
		});
		expect(updateStatusSpy).not.toHaveBeenCalled();
	});
});
