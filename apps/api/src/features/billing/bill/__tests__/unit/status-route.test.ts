import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../../../auth/auth.config";
import { billRoutes } from "../../api/routes";
import { BillRepository } from "../../infrastructure/bill.repository";

type BillRecord = NonNullable<Awaited<ReturnType<BillRepository["findById"]>>>;

describe("billRoutes status transitions", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
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

	it("allows valid transition DRAFT -> SENT", async () => {
		const findByIdSpy = vi
			.spyOn(BillRepository.prototype, "findById")
			.mockResolvedValue({
				id: "bill-1",
				companyId: "cmp-1",
				status: "DRAFT",
			} as BillRecord);
		const updateStatusSpy = vi
			.spyOn(BillRepository.prototype, "updateStatus")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({
					status: "SENT",
					actorId: "usr-1",
					actorName: "QA User",
					reason: "Initial approval",
				}),
			}),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({ success: true });
		expect(findByIdSpy).toHaveBeenCalledWith("bill-1");
		expect(updateStatusSpy).toHaveBeenCalledTimes(1);
		const [id, status, notes, userId] = updateStatusSpy.mock.calls[0]!;
		expect(id).toBe("bill-1");
		expect(status).toBe("SENT");
		expect(notes).toContain("[BILL_WORKFLOW]");
		expect(notes).toContain('"to":"SENT"');
		expect(notes).toContain('"actorName":"QA User"');
		expect(notes).toContain('"reason":"Initial approval"');
		expect(userId).toBe("usr-1");
	});

	it("rejects invalid transition PAID -> SENT", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue({
			id: "bill-1",
			companyId: "cmp-1",
			status: "PAID",
		} as BillRecord);
		const updateStatusSpy = vi
			.spyOn(BillRepository.prototype, "updateStatus")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({ status: "SENT" }),
			}),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
		});
		expect(updateStatusSpy).not.toHaveBeenCalled();
	});

	it("returns 404 when bill does not exist", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue(null);
		const updateStatusSpy = vi
			.spyOn(BillRepository.prototype, "updateStatus")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/missing/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({ status: "SENT" }),
			}),
		);

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			error: "Bill not found",
		});
		expect(updateStatusSpy).not.toHaveBeenCalled();
	});

	it("rejects spoofed actorId values that do not match resolved caller identity", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue({
			id: "bill-1",
			companyId: "cmp-1",
			status: "DRAFT",
		} as BillRecord);
		const updateStatusSpy = vi
			.spyOn(BillRepository.prototype, "updateStatus")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({
					status: "SENT",
					actorId: "spoofed-user",
				}),
			}),
		);

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toMatchObject({
			success: false,
			code: "AUTH_CONTEXT_MISMATCH",
		});
		expect(updateStatusSpy).not.toHaveBeenCalled();
	});

	it("denies spoofable header-only context on status mutation route", async () => {
		vi.spyOn(BillRepository.prototype, "findById").mockResolvedValue({
			id: "bill-1",
			companyId: "cmp-1",
			status: "DRAFT",
		} as BillRecord);
		const updateStatusSpy = vi
			.spyOn(BillRepository.prototype, "updateStatus")
			.mockResolvedValue(undefined);

		const app = new Elysia().use(billRoutes);
		const response = await app.handle(
			new Request("http://localhost/api/bills/bill-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
					"x-user-role": "owner",
					"x-auth-user-id": "auth-usr-1",
					"x-user-id": "usr-1",
				},
				body: JSON.stringify({ status: "SENT" }),
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
