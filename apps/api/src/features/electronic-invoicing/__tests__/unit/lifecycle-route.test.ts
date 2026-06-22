import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ElectronicInvoicingService } from "../../../../services/electronic-invoicing.service";
import { electronicInvoicingModule } from "../../index";

describe("electronicInvoicing lifecycle route", () => {
	const app = new Elysia().use(electronicInvoicingModule);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns 401 when company context is missing for transaction lifecycle", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/electronic-invoicing/lifecycle/tx-no-scope",
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toEqual({
			success: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("returns 401 when company context is missing with header for lifecycle", async () => {
		vi.spyOn(
			ElectronicInvoicingService,
			"getTransactionLifecycle",
		).mockResolvedValue({
			invoiceId: "inv-1",
			transactionId: "tx-1",
			invoiceNumber: "F001-1",
			currentStatus: "ACCEPTED",
			sunatStatus: "ACCEPTED",
			sunatCode: "0",
			sunatMessage: "ACEPTADO",
			runbook: {
				id: "RB-CPE-INCIDENT-2026-02",
				title: "Runbook de Incidentes CPE SUNAT/OSE",
				path: "docs/09-troubleshooting/cpe-compliance-incidents-runbook-2026.md",
			},
			createdAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedAt: new Date("2026-01-01T00:05:00.000Z"),
			evidence: {
				invoiceLinked: true,
				oseSubmissionRecorded: true,
				sunatResponseCaptured: true,
				cdrEvidenceStored: true,
				statusTransitionRecorded: true,
				latestProviderReference: "ose-ref-1",
				lastEventAt: new Date("2026-01-01T00:04:00.000Z"),
			},
			traceability: {
				traceable: true,
				finalStateReached: true,
				missing: [],
			},
			timeline: [
				{
					stage: "CREATED",
					status: "DRAFT",
					at: new Date("2026-01-01T00:00:00.000Z"),
					source: "SYSTEM",
				},
			],
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/electronic-invoicing/lifecycle/invoice/missing",
				{
					headers: { "x-company-id": "cmp-1" },
				},
			),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});
});
