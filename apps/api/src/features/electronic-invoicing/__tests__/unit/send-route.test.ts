import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ElectronicInvoicingService } from "../../../../services/electronic-invoicing.service";
import { OSEService } from "../../../../services/ose.service";
import { electronicInvoicingModule } from "../../index";

describe("electronicInvoicing send route", () => {
	const app = new Elysia().use(electronicInvoicingModule);
	const originalEnv = { ...process.env };

	afterEach(() => {
		vi.restoreAllMocks();
		OSEService.updateConfig({ webhookSecret: "" });
		process.env = { ...originalEnv };
	});

	it("returns 401 when company context is missing for send route with header", async () => {
		vi.spyOn(
			ElectronicInvoicingService,
			"recordGovernanceDecision",
		).mockResolvedValue();
		vi.spyOn(
			ElectronicInvoicingService,
			"processElectronicInvoice",
		).mockResolvedValue({
			success: false,
			transactionId: "tx-err",
			status: "ANNULLED",
			error: "OSE timeout",
			processingTime: 1530,
			runbook: {
				id: "RB-CPE-INCIDENT-2026-02",
				title: "Runbook de Incidentes CPE SUNAT/OSE",
				path: "docs/09-troubleshooting/cpe-compliance-incidents-runbook-2026.md",
			},
		});

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/send", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify({
					transactionId: "tx-err",
					xmlContent: "<Invoice />",
					invoiceNumber: "F001-100",
					invoiceType: "01",
				}),
			}),
		);

		expect(response.status).toBe(401);
	});

	it("processes CDR webhook and returns success envelope", async () => {
		vi.spyOn(ElectronicInvoicingService, "processCdrWebhook").mockResolvedValue(
			{
				success: true,
				transactionId: "tx-cdr",
				invoiceNumber: "F001-101",
				status: "ACCEPTED",
				message: "CDR procesado correctamente",
			},
		);

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					transactionId: "tx-cdr",
					invoiceNumber: "F001-101",
					cdrStatus: "ACEPTADO",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(ElectronicInvoicingService.processCdrWebhook).toHaveBeenCalledWith(
			expect.objectContaining({
				transactionId: "tx-cdr",
				invoiceNumber: "F001-101",
			}),
			undefined,
		);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				success: true,
				transactionId: "tx-cdr",
				status: "ACCEPTED",
			},
		});
	});

	it("rejects CDR webhook with invalid signature when secret is configured", async () => {
		OSEService.updateConfig({ webhookSecret: "integration-secret" });

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-ose-signature": "invalid-signature",
				},
				body: JSON.stringify({
					transactionId: "tx-cdr",
					invoiceNumber: "F001-102",
					cdrStatus: "ACEPTADO",
				}),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toEqual({
			success: false,
			error: "Firma de webhook inválida",
			code: "INVALID_WEBHOOK_SIGNATURE",
		});
	});

	it("returns 404 when CDR webhook cannot resolve a transaction", async () => {
		vi.spyOn(ElectronicInvoicingService, "processCdrWebhook").mockResolvedValue(
			{
				success: false,
				invoiceNumber: "F001-103",
				message: "No se encontró transacción para el CDR recibido",
			},
		);

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					invoiceNumber: "F001-103",
					cdrStatus: "ACEPTADO",
				}),
			}),
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload).toEqual({
			success: false,
			error: "No se encontró transacción para el CDR recibido",
			code: "TRANSACTION_NOT_FOUND",
		});
	});

	it("passes x-company-id to CDR webhook processing when provided", async () => {
		vi.spyOn(ElectronicInvoicingService, "processCdrWebhook").mockResolvedValue(
			{
				success: true,
				transactionId: "tx-cdr-company",
				invoiceNumber: "F001-104",
				status: "ACCEPTED",
				message: "CDR procesado correctamente",
			},
		);

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/webhooks/cdr", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": "cmp-cdr-1",
				},
				body: JSON.stringify({
					invoiceNumber: "F001-104",
					cdrStatus: "ACEPTADO",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(ElectronicInvoicingService.processCdrWebhook).toHaveBeenCalledWith(
			expect.objectContaining({
				invoiceNumber: "F001-104",
			}),
			"cmp-cdr-1",
		);
	});

	it("returns 401 when company context is missing for send route without header", async () => {
		const governanceSpy = vi.spyOn(
			ElectronicInvoicingService,
			"recordGovernanceDecision",
		);
		const processSpy = vi.spyOn(
			ElectronicInvoicingService,
			"processElectronicInvoice",
		);

		const response = await app.handle(
			new Request("http://localhost/api/electronic-invoicing/send", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					transactionId: "tx-no-scope",
					xmlContent: "<Invoice />",
					invoiceNumber: "F001-889",
					invoiceType: "01",
				}),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toEqual({
			success: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
		});
		expect(governanceSpy).not.toHaveBeenCalled();
		expect(processSpy).not.toHaveBeenCalled();
	});
});
