import { describe, expect, it } from "vitest";
import { getInvoiceOseTimelineIcon } from "../invoice-ose-timeline-icon";

describe("getInvoiceOseTimelineIcon", () => {
	it("returns a success icon for accepted events", () => {
		expect(getInvoiceOseTimelineIcon("ACCEPTED")).toMatchObject({
			label: "Estado exitoso",
			className: expect.stringContaining("text-[var(--premium-success)]"),
		});
	});

	it("returns an in-flight icon for submitted events", () => {
		expect(getInvoiceOseTimelineIcon("submitted")).toMatchObject({
			label: "Estado en proceso",
			className: expect.stringContaining("text-[var(--color-info)]"),
		});
	});

	it("returns a destructive icon for failed events", () => {
		expect(getInvoiceOseTimelineIcon("FAILED")).toMatchObject({
			label: "Estado fallido",
			className: expect.stringContaining("text-destructive"),
		});
	});

	it("falls back to a neutral icon for unknown statuses", () => {
		expect(getInvoiceOseTimelineIcon("QUEUED")).toMatchObject({
			label: "Estado neutro",
			className: expect.stringContaining("text-muted-foreground"),
		});
	});
});
