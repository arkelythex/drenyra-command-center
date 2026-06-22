import { describe, it, expect, vi, beforeEach } from "vitest";
import { CpeLifecycleService } from "../../application/services/cpe-lifecycle.service";
import type {
	CpeLifecycleSnapshot,
	ElectronicInvoicingTrailEvent,
} from "../../domain/cpe.types";

describe("CpeLifecycleService", () => {
	describe("assessTraceability", () => {
		function makeTimeline(
			events: Partial<ElectronicInvoicingTrailEvent>[],
		): CpeLifecycleSnapshot["timeline"] {
			return events.map((e) => ({
				stage: e.stage ?? "UNKNOWN",
				status: e.status ?? "DRAFT",
				at: new Date(e.at ?? "2026-01-01T00:00:00.000Z"),
				source: (e.source ?? "SYSTEM") as "SYSTEM" | "SUNAT",
				message: e.message ?? "",
				metadata: e.metadata,
			}));
		}

		it("returns traceable when all evidence is present for ACCEPTED status", () => {
			const timeline = makeTimeline([
				{ stage: "CREATED", status: "DRAFT", at: "2026-01-01T00:00:00.000Z" },
				{
					stage: "OSE_SUBMISSION",
					status: "SUBMITTED",
					at: "2026-01-01T00:01:00.000Z",
				},
				{
					stage: "OSE_RESPONSE",
					status: "ACCEPTED",
					at: "2026-01-01T00:02:00.000Z",
				},
				{
					stage: "STATUS_UPDATE",
					status: "ACCEPTED",
					at: "2026-01-01T00:03:00.000Z",
				},
				{
					stage: "CDR_WEBHOOK",
					status: "ACCEPTED",
					at: "2026-01-01T00:04:00.000Z",
					metadata: { providerReference: "ose-ref-1" },
				},
			]);

			const result = CpeLifecycleService.assessTraceability({
				invoiceId: "inv-1",
				currentStatus: "ACCEPTED",
				sunatStatus: "ACCEPTED",
				timeline,
				cdrContent: "<cdr>data</cdr>",
			});

			expect(result.traceable).toBe(true);
			expect(result.finalStateReached).toBe(true);
			expect(result.missing).toEqual([]);
			expect(result.invoiceLinked).toBe(true);
			expect(result.oseSubmissionRecorded).toBe(true);
			expect(result.sunatResponseCaptured).toBe(true);
			expect(result.cdrEvidenceStored).toBe(true);
			expect(result.statusTransitionRecorded).toBe(true);
		});

		it("identifies missing evidence for DRAFT status", () => {
			const timeline = makeTimeline([
				{ stage: "CREATED", status: "DRAFT", at: "2026-01-01T00:00:00.000Z" },
			]);

			const result = CpeLifecycleService.assessTraceability({
				currentStatus: "DRAFT",
				sunatStatus: null,
				timeline,
			});

			expect(result.traceable).toBe(false);
			expect(result.finalStateReached).toBe(false);
			expect(result.missing).toContain("FINAL_STATUS");
			expect(result.missing).not.toContain("OSE_SUBMISSION");
			expect(result.missing).not.toContain("STATUS_TRANSITION");
		});

		it("flags missing SUNAT_RESPONSE for SUBMITTED status", () => {
			const timeline = makeTimeline([
				{ stage: "CREATED", status: "DRAFT", at: "2026-01-01T00:00:00.000Z" },
				{
					stage: "OSE_SUBMISSION",
					status: "SUBMITTED",
					at: "2026-01-01T00:01:00.000Z",
				},
				{
					stage: "STATUS_UPDATE",
					status: "SUBMITTED",
					at: "2026-01-01T00:02:00.000Z",
				},
			]);

			const result = CpeLifecycleService.assessTraceability({
				currentStatus: "SUBMITTED",
				sunatStatus: "",
				timeline,
			});

			expect(result.missing).toContain("SUNAT_RESPONSE");
			expect(result.missing).toContain("FINAL_STATUS");
		});

		it("flags missing CDR_EVIDENCE for REJECTED status", () => {
			const timeline = makeTimeline([
				{ stage: "CREATED", status: "DRAFT", at: "2026-01-01T00:00:00.000Z" },
				{
					stage: "OSE_SUBMISSION",
					status: "SUBMITTED",
					at: "2026-01-01T00:01:00.000Z",
				},
				{
					stage: "OSE_RESPONSE",
					status: "REJECTED",
					at: "2026-01-01T00:02:00.000Z",
				},
				{
					stage: "STATUS_UPDATE",
					status: "REJECTED",
					at: "2026-01-01T00:03:00.000Z",
				},
			]);

			const result = CpeLifecycleService.assessTraceability({
				invoiceId: "inv-1",
				currentStatus: "REJECTED",
				sunatStatus: "REJECTED",
				timeline,
				cdrContent: null,
			});

			expect(result.missing).toContain("CDR_EVIDENCE");
		});

		it("flags missing ANNULLED_REASON when status is ANNULLED without error stages", () => {
			const timeline = makeTimeline([
				{ stage: "CREATED", status: "DRAFT", at: "2026-01-01T00:00:00.000Z" },
				{
					stage: "STATUS_UPDATE",
					status: "ANNULLED",
					at: "2026-01-01T00:01:00.000Z",
				},
			]);

			const result = CpeLifecycleService.assessTraceability({
				currentStatus: "ANNULLED",
				sunatStatus: "ANNULLED",
				timeline,
			});

			expect(result.missing).toContain("ANNULLED_REASON");
		});

		it("captures latest provider reference from CDR_WEBHOOK event", () => {
			const timeline = makeTimeline([
				{
					stage: "CDR_WEBHOOK",
					status: "ACCEPTED",
					at: "2026-01-01T00:01:00.000Z",
					metadata: { providerReference: "ref-abc" },
				},
			]);

			const result = CpeLifecycleService.assessTraceability({
				currentStatus: "ACCEPTED",
				sunatStatus: "ACCEPTED",
				timeline,
				cdrContent: "<cdr>x</cdr>",
				invoiceId: "inv-1",
			});

			expect(result.latestProviderReference).toBe("ref-abc");
		});

		it("returns null for lastEventAt when no non-draft events exist", () => {
			const timeline = makeTimeline([
				{ stage: "CREATED", status: "DRAFT", at: "2026-01-01T00:00:00.000Z" },
			]);

			const result = CpeLifecycleService.assessTraceability({
				currentStatus: "DRAFT",
				sunatStatus: null,
				timeline,
			});

			expect(result.lastEventAt).toBeNull();
		});

		it("detects sunatResponseCaptured from OSE_RESPONSE stage even without sunatStatus string", () => {
			const timeline = makeTimeline([
				{
					stage: "OSE_RESPONSE",
					status: "ACCEPTED",
					at: "2026-01-01T00:01:00.000Z",
				},
			]);

			const result = CpeLifecycleService.assessTraceability({
				currentStatus: "ACCEPTED",
				sunatStatus: null,
				timeline,
				cdrContent: "<cdr>x</cdr>",
				invoiceId: "inv-1",
			});

			expect(result.sunatResponseCaptured).toBe(true);
		});
	});
});
