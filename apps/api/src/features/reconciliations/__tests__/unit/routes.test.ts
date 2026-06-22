import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReconciliationWorkerClient } from "../../../../shared/clients/reconciliation-worker.client";
import { ReconciliationService } from "../../application/services/reconciliation.service";
import { reconciliationsModule } from "../../index";

type PendingReconciliations = Awaited<
	ReturnType<ReconciliationService["getPending"]>
>;

describe("reconciliations routes", () => {
	const app = new Elysia().use(reconciliationsModule);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns pending reconciliations scoped by company", async () => {
		const spy = vi
			.spyOn(ReconciliationService.prototype, "getPending")
			.mockResolvedValue([{ id: "tx-1" }] as PendingReconciliations);

		const response = await app.handle(
			new Request(
				"http://localhost/api/reconciliations/pending?companyId=cmp-1&limit=25",
			),
		);

		expect(response.status).toBe(200);
		expect(spy).toHaveBeenCalledWith("cmp-1", 25);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: [{ id: "tx-1" }],
		});
	});

	it("returns 422 when companyId is missing in scoped endpoints", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/reconciliations/pending"),
		);

		expect(response.status).toBe(422);
	});

	it("returns 404 when reconcile target is not found in tenant scope", async () => {
		vi.spyOn(ReconciliationService.prototype, "reconcile").mockResolvedValue(
			null,
		);

		const response = await app.handle(
			new Request("http://localhost/api/reconciliations/tx-missing/reconcile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					notes: "manual",
				}),
			}),
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "TRANSACTION_NOT_FOUND",
		});
	});

	it("returns stats envelope scoped by company", async () => {
		const spy = vi
			.spyOn(ReconciliationService.prototype, "getStats")
			.mockResolvedValue({
				total: 2,
				reconciled: { count: 1, amount: 120 },
				pending: { count: 1, amount: 80 },
				percentage: 50,
			});

		const response = await app.handle(
			new Request("http://localhost/api/reconciliations/stats?companyId=cmp-1"),
		);

		expect(response.status).toBe(200);
		expect(spy).toHaveBeenCalledWith("cmp-1");
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				total: 2,
				percentage: 50,
			},
		});
	});

	it("returns 503 when external go worker is unavailable", async () => {
		vi.spyOn(ReconciliationWorkerClient, "healthCheck").mockResolvedValue({
			status: "offline",
		});

		const response = await app.handle(
			new Request("http://localhost/api/reconciliations/external/reconcile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sourceA: [{ reference: "F001-1", amountCents: 10000 }],
					sourceB: [{ reference: "F001-1", amountCents: 10000 }],
					toleranceCents: 0,
				}),
			}),
		);

		expect(response.status).toBe(503);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "RECONCILIATION_WORKER_UNAVAILABLE",
		});
	});

	it("returns external reconcile result when go worker is healthy", async () => {
		vi.spyOn(ReconciliationWorkerClient, "healthCheck").mockResolvedValue({
			status: "ok",
			service: "go-reconciliation-worker",
		});
		vi.spyOn(ReconciliationWorkerClient, "reconcile").mockResolvedValue({
			matched: 1,
			missingInSourceA: [],
			missingInSourceB: [],
			amountMismatches: [],
			totalDiscrepancies: 0,
		});

		const response = await app.handle(
			new Request("http://localhost/api/reconciliations/external/reconcile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sourceA: [{ reference: "F001-1", amountCents: 10000 }],
					sourceB: [{ reference: "F001-1", amountCents: 10000 }],
					toleranceCents: 10,
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				matched: 1,
				totalDiscrepancies: 0,
			},
		});
	});
});
