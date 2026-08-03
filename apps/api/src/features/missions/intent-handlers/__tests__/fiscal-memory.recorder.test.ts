/**
 * FiscalMemoryRecorder — unit tests.
 *
 * No monetary fields exist in the fiscal-memory model; Drenyra money values
 * are BigInt cents (repo-wide rule) and nothing here touches them.
 */

import type { ClosingProposal } from "@drenyra/application/use-cases/monthly-close";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createFiscalMemoryRecorder,
	EngramFiscalMemoryRecorder,
	NoopFiscalMemoryRecorder,
} from "../fiscal-memory.recorder";

vi.mock(
	"@drenyra/persistence/repositories/support/organization-resolver",
	() => ({
		resolveCompanyRuc: vi.fn(),
		tryResolveOrganizationIdFromCompany: vi.fn(),
	}),
);

import {
	resolveCompanyRuc,
	tryResolveOrganizationIdFromCompany,
} from "@drenyra/persistence/repositories/support/organization-resolver";

const RUC = "20123456789";
const companyId = "550e8400-e29b-41d4-a716-446655440000";
const missionId = "550e8400-e29b-41d4-a716-446655440001";

const PROPOSAL: ClosingProposal = {
	id: "prop-1",
	missionId,
	version: 1,
	fiscalPeriod: "2026-07",
	generatedAt: "2026-08-01T00:00:00Z",
	proposedEntries: [],
	entryCount: 5,
	totalDebitCents: 100000n as never,
	totalCreditCents: 100000n as never,
	taxImpact: { igvCents: 18000n as never },
	financialImpact: {} as never,
	riskLevel: "HIGH",
	unresolvedExceptions: [],
	requiredApprovals: ["reviewer-1"],
	sourceEvidence: [
		{ id: "evidence/inv-1", type: "invoice", hash: "abc123", uri: "s3://x" },
	],
	evidenceHash: "a1b2c3d4e5f6g7h8i9j0",
};

function makeRepo() {
	return { save: vi.fn().mockResolvedValue(undefined) } as never;
}

describe("EngramFiscalMemoryRecorder", () => {
	let repo: ReturnType<typeof makeRepo>;
	let recorder: EngramFiscalMemoryRecorder;

	beforeEach(() => {
		vi.clearAllMocks();
		repo = makeRepo();
		recorder = new EngramFiscalMemoryRecorder(repo);
		vi.mocked(resolveCompanyRuc).mockResolvedValue(RUC);
		vi.mocked(tryResolveOrganizationIdFromCompany).mockResolvedValue(42);
	});

	it("records a monthly_closing memory with scope, evidence and severity", async () => {
		await recorder.recordApprovedProposal({
			missionId,
			companyId,
			proposal: PROPOSAL,
			approvedBy: "reviewer-1",
		});

		expect(repo.save).toHaveBeenCalledTimes(1);
		const memory = repo.save.mock.calls[0][0];
		expect(memory.category).toBe("monthly_closing");
		expect(memory.severity).toBe("high"); // riskLevel HIGH
		expect(memory.period).toBe("2026-07");
		expect(memory.ruc).toBe(RUC);
		expect(memory.tenantId).toBe("42");
		expect(memory.evidenceRefs).toEqual(["evidence/inv-1"]);
		expect(memory.createdBy).toBe("reviewer-1");
		expect(memory.sourceAgentId).toBe(missionId);
		expect(memory.tags).toContain("high");
	});

	it("maps MEDIUM risk to medium severity", async () => {
		await recorder.recordApprovedProposal({
			missionId,
			companyId,
			proposal: { ...PROPOSAL, riskLevel: "MEDIUM" },
			approvedBy: "system",
		});
		expect(repo.save.mock.calls[0][0].severity).toBe("medium");
	});

	it("falls back to the api tenant when no organization is mapped", async () => {
		vi.mocked(tryResolveOrganizationIdFromCompany).mockResolvedValue(null);
		await recorder.recordApprovedProposal({
			missionId,
			companyId,
			proposal: PROPOSAL,
			approvedBy: "system",
		});
		expect(repo.save.mock.calls[0][0].tenantId).toBe("api");
	});
});

describe("NoopFiscalMemoryRecorder", () => {
	it("does nothing (fail closed when engram is disabled)", async () => {
		const noop = new NoopFiscalMemoryRecorder();
		await expect(
			noop.recordApprovedProposal({
				missionId,
				companyId,
				proposal: PROPOSAL,
				approvedBy: "system",
			}),
		).resolves.toBeUndefined();
	});
});

describe("createFiscalMemoryRecorder", () => {
	it("returns the noop recorder when engram is disabled (fail closed)", () => {
		vi.stubEnv("DRENYRA_ENGRAM_ENABLED", "false");
		const recorder = createFiscalMemoryRecorder();
		expect(recorder).toBeInstanceOf(NoopFiscalMemoryRecorder);
		vi.unstubAllEnvs();
	});
});
