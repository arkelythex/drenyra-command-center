import { describe, expect, it } from "vitest";
import { getInvoiceOseStatusTone } from "../invoice-ose-status-tone";

describe("getInvoiceOseStatusTone", () => {
	it("returns the accepted tone for successful statuses", () => {
		expect(getInvoiceOseStatusTone(" accepted ")).toMatchObject({
			label: "Aceptado",
		});
	});

	it("returns the observed tone for observed statuses", () => {
		expect(getInvoiceOseStatusTone("OBSERVED")).toMatchObject({
			label: "Observado",
		});
	});

	it("returns the rejected tone for rejected statuses", () => {
		expect(getInvoiceOseStatusTone("REJECTED")).toMatchObject({
			label: "Rechazado",
		});
	});

	it("falls back to a neutral review tone when the status is missing", () => {
		expect(getInvoiceOseStatusTone(undefined)).toMatchObject({
			label: "Revision",
		});
	});
});
