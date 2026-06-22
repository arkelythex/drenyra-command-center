import { describe, expect, it } from "vitest";
import { getInvoiceOseTimelineTone } from "../invoice-ose-timeline-tone";

describe("getInvoiceOseTimelineTone", () => {
	it("returns the success tone for accepted events", () => {
		expect(getInvoiceOseTimelineTone("ACCEPTED")).toMatchObject({
			containerClassName: expect.stringContaining("--premium-success-rgb"),
		});
	});

	it("returns the in-flight tone for submitted events", () => {
		expect(getInvoiceOseTimelineTone("submitted")).toMatchObject({
			statusBadgeClassName: expect.stringContaining("text-[var(--color-info)]"),
		});
	});

	it("returns the destructive tone for failed events", () => {
		expect(getInvoiceOseTimelineTone("FAILED")).toMatchObject({
			statusBadgeClassName: expect.stringContaining("text-destructive"),
		});
	});

	it("falls back to neutral when the event status is unknown", () => {
		expect(getInvoiceOseTimelineTone("QUEUED")).toMatchObject({
			statusBadgeClassName: expect.stringContaining("text-foreground"),
		});
	});
});
