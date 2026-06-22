import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { drenyraModule } from "../drenyra.routes";

const headers = {
	"content-type": "application/json",
	"x-company-id": "company-command-001",
	"x-company-ruc": "20123456786",
	"x-drenyra-capability-grant": "scoped",
	"x-drenyra-redaction-ok": "true",
	"x-fiscal-period": "2026-05",
	"x-user-id": "user-command-001",
};

function app() {
	return new Elysia().use(drenyraModule);
}

async function postReviewSunat(requestHeaders: Record<string, string>): Promise<Response> {
	return app().handle(
		new Request("http://localhost/api/drenyra/commands/review-sunat", {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify({ caseId: "case-command-001", sourceRef: "sunat:sire" }),
		}),
	);
}

async function postPrepareEvidence(requestHeaders: Record<string, string>): Promise<Response> {
	return app().handle(
		new Request("http://localhost/api/drenyra/commands/prepare-evidence", {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify({
				caseId: "case-command-001",
				documentId: "doc-command-001",
				sourceRef: "document:invoice",
			}),
		}),
	);
}

async function postAnalyzeInvoice(requestHeaders: Record<string, string>): Promise<Response> {
	return app().handle(
		new Request("http://localhost/api/drenyra/commands/analyze-invoice", {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify({
				caseId: "case-command-001",
				invoiceId: "invoice-command-001",
				sourceRef: "invoice:F001-123",
			}),
		}),
	);
}

describe("Drenyra command envelope routes", () => {
	it("returns a scoped review-sunat command envelope", async () => {
		const response = await postReviewSunat(headers);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			commandId: "review-sunat",
			status: "ready",
			riskLevel: "MEDIUM",
			scope: {
				companyId: "company-command-001",
				companyRuc: "20123456786",
				period: "2026-05",
				countryCode: "PE",
			},
			approval: { required: false, status: "not_required" },
			diff: { kind: "none" },
		});
		expect(payload.data.evidence).toHaveLength(1);
		expect(payload.data.deterministicChecks.map((check: { id: string }) => check.id)).toEqual([
			"ruc-checksum",
			"period-scope",
		]);
		expect(payload.data.trace.traceId).toMatch(/^cmd-/);
	});

	it("denies review-sunat envelope without a scoped capability grant", async () => {
		const response = await postReviewSunat({ ...headers, "x-drenyra-capability-grant": "" });
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.details.reason).toBe("Capability grant is missing");
	});

	it("returns a scoped prepare-evidence command envelope", async () => {
		const response = await postPrepareEvidence(headers);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			commandId: "prepare-evidence",
			status: "ready",
			riskLevel: "LOW",
			approval: { required: false, status: "not_required" },
			diff: {
				kind: "evidence_bundle",
				after: { preparedEvidenceId: "document-doc-command-001" },
			},
		});
		expect(payload.data.evidence[0]).toMatchObject({
			id: "document-doc-command-001",
			type: "DOCUMENT",
			sourceRef: "document:invoice",
		});
		expect(payload.data.deterministicChecks.map((check: { id: string }) => check.id)).toEqual([
			"evidence-scope",
			"mutation-check",
		]);
	});

	it("denies prepare-evidence envelope when redaction proof is missing", async () => {
		const response = await postPrepareEvidence({ ...headers, "x-drenyra-redaction-ok": "" });
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.details.reason).toBe("Required redaction failed");
	});

	it("returns a scoped analyze-invoice command envelope", async () => {
		const response = await postAnalyzeInvoice(headers);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			commandId: "analyze-invoice",
			status: "ready",
			riskLevel: "MEDIUM",
			approval: { required: false, status: "not_required" },
			diff: {
				kind: "risk_profile",
				after: { analyzedInvoiceId: "invoice-invoice-command-001" },
			},
		});
		expect(payload.data.evidence[0]).toMatchObject({
			id: "invoice-invoice-command-001",
			type: "DOCUMENT",
			sourceRef: "invoice:F001-123",
		});
		expect(payload.data.deterministicChecks.map((check: { id: string }) => check.id)).toEqual([
			"invoice-scope",
			"cpe-review-ready",
		]);
	});

	it("denies analyze-invoice envelope without a scoped capability grant", async () => {
		const response = await postAnalyzeInvoice({
			...headers,
			"x-drenyra-capability-grant": "",
		});
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.details.reason).toBe("Capability grant is missing");
	});
});
