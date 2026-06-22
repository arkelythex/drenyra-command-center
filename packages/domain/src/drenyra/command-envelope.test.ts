import { describe, expect, it } from "vitest";
import {
	DRENYRA_COMMAND_ID,
	DRENYRA_COMMAND_STATUS,
	DRENYRA_DETERMINISTIC_CHECK_STATUS,
	createDrenyraCommandEnvelope,
	type CreateDrenyraCommandEnvelopeInput,
	type DrenyraFiscalScope,
} from "./index";

const scope: DrenyraFiscalScope = {
	organizationId: "org-command-001",
	companyId: "company-command-001",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
};

function input(overrides: Partial<CreateDrenyraCommandEnvelopeInput> = {}) {
	return {
		commandId: DRENYRA_COMMAND_ID.REVIEW_SUNAT,
		status: DRENYRA_COMMAND_STATUS.READY,
		scope,
		title: "SUNAT review",
		summary: "Review completed with deterministic checks",
		riskLevel: "MEDIUM" as const,
		evidence: [
			{
				id: "evidence-1",
				type: "SUNAT_RECORD" as const,
				title: "SIRE purchase row",
				contentHash: "sha256:abc",
			},
		],
		deterministicChecks: [
			{
				id: "check-1",
				label: "RUC checksum",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "RUC is valid",
				evidenceIds: ["evidence-1"],
			},
		],
		trace: { traceId: "trace-command-1", createdAt: "2026-05-26T00:00:00.000Z" },
		...overrides,
	};
}

describe("Drenyra command envelope", () => {
	it("creates a scoped command envelope for CLI and Web surfaces", () => {
		const envelope = createDrenyraCommandEnvelope(input());

		expect(envelope.commandId).toBe("review-sunat");
		expect(envelope.scope).toEqual(scope);
		expect(envelope.evidence).toHaveLength(1);
		expect(envelope.deterministicChecks[0].evidenceIds).toEqual(["evidence-1"]);
		expect(envelope.approval.status).toBe("not_required");
		expect(envelope.diff.kind).toBe("none");
	});

	it("defaults approval to pending when command needs approval", () => {
		const envelope = createDrenyraCommandEnvelope(
			input({ status: DRENYRA_COMMAND_STATUS.NEEDS_APPROVAL }),
		);

		expect(envelope.approval).toMatchObject({ required: true, status: "pending" });
	});

	it("rejects incomplete fiscal scope", () => {
		expect(() =>
			createDrenyraCommandEnvelope(
				input({ scope: { ...scope, period: "2026-13" } }),
			),
		).toThrow("DRENYRA_COMMAND_SCOPE_INCOMPLETE");
	});

	it("rejects deterministic checks that reference missing evidence", () => {
		expect(() =>
			createDrenyraCommandEnvelope(
				input({
					deterministicChecks: [
						{
							id: "check-missing",
							label: "Missing evidence",
							status: DRENYRA_DETERMINISTIC_CHECK_STATUS.FAILED,
							summary: "Missing ref",
							evidenceIds: ["missing"],
						},
					],
				}),
			),
		).toThrow("DRENYRA_COMMAND_CHECK_EVIDENCE_MISSING");
	});
});
