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
	"x-trace-id": "trace-ledger-proposal-001",
	"x-user-id": "user-command-001",
};

function app() {
	return new Elysia().use(drenyraModule);
}

async function postProposeLedgerEntry(
	body: Record<string, unknown>,
	requestHeaders = headers,
): Promise<Response> {
	return app().handle(
		new Request("http://localhost/api/drenyra/commands/propose-ledger-entry", {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify(body),
		}),
	);
}

describe("Drenyra propose-ledger-entry command envelope route", () => {
	it("returns a pending approval ledger proposal envelope", async () => {
		const response = await postProposeLedgerEntry({
			approvalId: "approval-ledger-001",
			caseId: "case-command-001",
			ledgerDraftId: "draft-001",
			sourceRef: "fal:draft-001",
		});
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			commandId: "propose-ledger-entry",
			status: "needs_approval",
			riskLevel: "HIGH",
			approval: {
				required: true,
				approvalId: "approval-ledger-001",
				status: "pending",
			},
			diff: {
				kind: "ledger_entry",
				after: { proposedLedgerEntryId: "ledger-draft-draft-001" },
			},
			trace: {
				traceId: "trace-ledger-proposal-001",
				caseId: "case-command-001",
			},
		});
		expect(
			payload.data.deterministicChecks.map((check: { id: string }) => check.id),
		).toEqual(["ledger-scope", "posting-blocked"]);
	});

	it("denies ledger proposals without a scoped capability grant", async () => {
		const response = await postProposeLedgerEntry(
			{ approvalId: "approval-ledger-001" },
			{ ...headers, "x-drenyra-capability-grant": "" },
		);
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.details.reason).toBe("Capability grant is missing");
	});
});
