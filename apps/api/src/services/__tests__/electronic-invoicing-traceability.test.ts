import { describe, expect, it } from "vitest";
import { ElectronicInvoicingService } from "../electronic-invoicing.service";

describe("ElectronicInvoicingService.assessLifecycleTraceability", () => {
	it("marks lifecycle as traceable when final evidence chain is complete", () => {
		const result = ElectronicInvoicingService.assessLifecycleTraceability({
			invoiceId: "inv-1",
			currentStatus: "ACCEPTED",
			sunatStatus: "ACCEPTED",
			cdrContent: "https://storage.drenyra.local/cdr/F001-1.xml",
			timeline: [
				{
					stage: "CREATED",
					status: "DRAFT",
					at: new Date("2026-03-01T10:00:00.000Z"),
					source: "SYSTEM",
					message: "Creado",
				},
				{
					stage: "OSE_SUBMISSION",
					status: "SENT",
					at: new Date("2026-03-01T10:01:00.000Z"),
					source: "SYSTEM",
					message: "Enviado a OSE",
				},
				{
					stage: "OSE_RESPONSE",
					status: "ACCEPTED",
					at: new Date("2026-03-01T10:02:00.000Z"),
					source: "SUNAT",
					message: "Aceptado",
				},
				{
					stage: "CDR_WEBHOOK",
					status: "ACCEPTED",
					at: new Date("2026-03-01T10:03:00.000Z"),
					source: "SUNAT",
					message: "CDR aceptado",
					metadata: {
						providerReference: "ose-ref-1",
					},
				},
				{
					stage: "STATUS_UPDATE",
					status: "ACCEPTED",
					at: new Date("2026-03-01T10:04:00.000Z"),
					source: "SYSTEM",
					message: "Estado actualizado",
				},
			],
		});

		expect(result.traceable).toBe(true);
		expect(result.finalStateReached).toBe(true);
		expect(result.latestProviderReference).toBe("ose-ref-1");
		expect(result.missing).toEqual([]);
	});

	it("flags missing evidence for submitted transactions without SUNAT response", () => {
		const result = ElectronicInvoicingService.assessLifecycleTraceability({
			invoiceId: "inv-2",
			currentStatus: "SUBMITTED",
			sunatStatus: null,
			cdrContent: null,
			timeline: [
				{
					stage: "CREATED",
					status: "DRAFT",
					at: new Date("2026-03-02T10:00:00.000Z"),
					source: "SYSTEM",
					message: "Creado",
				},
				{
					stage: "OSE_SUBMISSION",
					status: "SENT",
					at: new Date("2026-03-02T10:01:00.000Z"),
					source: "SYSTEM",
					message: "Enviado a OSE",
				},
				{
					stage: "STATUS_UPDATE",
					status: "SUBMITTED",
					at: new Date("2026-03-02T10:02:00.000Z"),
					source: "SYSTEM",
					message: "Estado actualizado",
				},
			],
		});

		expect(result.traceable).toBe(false);
		expect(result.finalStateReached).toBe(false);
		expect(result.missing).toEqual(["FINAL_STATUS", "SUNAT_RESPONSE"]);
	});

	it("flags missing invoice link and cdr evidence for accepted transactions", () => {
		const result = ElectronicInvoicingService.assessLifecycleTraceability({
			currentStatus: "ACCEPTED",
			sunatStatus: "ACCEPTED",
			cdrContent: null,
			timeline: [
				{
					stage: "CREATED",
					status: "DRAFT",
					at: new Date("2026-03-03T10:00:00.000Z"),
					source: "SYSTEM",
					message: "Creado",
				},
				{
					stage: "OSE_SUBMISSION",
					status: "SENT",
					at: new Date("2026-03-03T10:01:00.000Z"),
					source: "SYSTEM",
					message: "Enviado a OSE",
				},
				{
					stage: "OSE_RESPONSE",
					status: "ACCEPTED",
					at: new Date("2026-03-03T10:02:00.000Z"),
					source: "SUNAT",
					message: "Aceptado",
				},
				{
					stage: "STATUS_UPDATE",
					status: "ACCEPTED",
					at: new Date("2026-03-03T10:03:00.000Z"),
					source: "SYSTEM",
					message: "Estado actualizado",
				},
			],
		});

		expect(result.traceable).toBe(false);
		expect(result.missing).toEqual(["INVOICE_LINK", "CDR_EVIDENCE"]);
	});

	it("flags annulled transactions without recorded failure reason", () => {
		const result = ElectronicInvoicingService.assessLifecycleTraceability({
			invoiceId: "inv-3",
			currentStatus: "ANNULLED",
			sunatStatus: null,
			cdrContent: null,
			timeline: [
				{
					stage: "CREATED",
					status: "DRAFT",
					at: new Date("2026-03-04T10:00:00.000Z"),
					source: "SYSTEM",
					message: "Creado",
				},
				{
					stage: "STATUS_UPDATE",
					status: "ANNULLED",
					at: new Date("2026-03-04T10:03:00.000Z"),
					source: "SYSTEM",
					message: "Estado actualizado",
				},
			],
		});

		expect(result.traceable).toBe(false);
		expect(result.missing).toEqual(["OSE_SUBMISSION", "ANNULLED_REASON"]);
	});
});
