import { describe, expect, it } from "vitest";
import {
	getInvoiceRunbookHref,
	getOpenableInvoiceArtifactUrl,
	getPersistedInvoiceTicket,
	getPersistedSunatCode,
	getPersistedSunatIncidentMessage,
	getPersistedSunatStatus,
} from "../invoice-artifacts";

describe("getOpenableInvoiceArtifactUrl", () => {
	it("returns the URL when the artifact is openable", () => {
		expect(
			getOpenableInvoiceArtifactUrl(
				"https://ose.example.test/cdr/F001-00000001.zip",
			),
		).toBe("https://ose.example.test/cdr/F001-00000001.zip");
	});

	it("returns null for non-http artifacts", () => {
		expect(getOpenableInvoiceArtifactUrl("cdr-inline-xml")).toBeNull();
		expect(getOpenableInvoiceArtifactUrl(null)).toBeNull();
	});
});

describe("getPersistedInvoiceTicket", () => {
	it("returns a normalized ticket when present", () => {
		expect(getPersistedInvoiceTicket("  TKT-2026-000001  ")).toBe(
			"TKT-2026-000001",
		);
	});

	it("returns null for empty tickets", () => {
		expect(getPersistedInvoiceTicket("   ")).toBeNull();
		expect(getPersistedInvoiceTicket(undefined)).toBeNull();
	});
});

describe("getInvoiceRunbookHref", () => {
	it("normalizes repo-relative runbook paths", () => {
		expect(
			getInvoiceRunbookHref({
				path: "docs/09-troubleshooting/cpe-compliance-incidents-runbook-2026.md",
				anchor: "ose",
			}),
		).toBe(
			"/docs/09-troubleshooting/cpe-compliance-incidents-runbook-2026.md#ose",
		);
	});

	it("returns null when runbook metadata is missing", () => {
		expect(getInvoiceRunbookHref(null)).toBeNull();
	});
});

describe("getPersistedSunatStatus", () => {
	it("normalizes the persisted SUNAT status", () => {
		expect(getPersistedSunatStatus(" accepted ")).toBe("ACCEPTED");
	});

	it("returns null for empty status values", () => {
		expect(getPersistedSunatStatus("  ")).toBeNull();
		expect(getPersistedSunatStatus(undefined)).toBeNull();
	});
});

describe("getPersistedSunatCode", () => {
	it("normalizes the persisted SUNAT code", () => {
		expect(getPersistedSunatCode(" 0 ")).toBe("0");
	});

	it("returns null for empty code values", () => {
		expect(getPersistedSunatCode(" ")).toBeNull();
		expect(getPersistedSunatCode(null)).toBeNull();
	});
});

describe("getPersistedSunatIncidentMessage", () => {
	it("returns the message for rejected or observed incidents", () => {
		expect(
			getPersistedSunatIncidentMessage({
				status: "REJECTED",
				code: "2320",
				message: "RUC emisor inválido",
			}),
		).toBe("RUC emisor inválido");
	});

	it("ignores informational messages for accepted CPEs", () => {
		expect(
			getPersistedSunatIncidentMessage({
				status: "ACCEPTED",
				code: "0",
				message: "CDR aceptado",
			}),
		).toBeNull();
	});
});
