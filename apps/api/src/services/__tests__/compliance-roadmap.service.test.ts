import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	ComplianceRoadmapAction,
	ComplianceRoadmapSnapshot,
} from "@drenyra/domain";
import {
	type AccountingJobRunRecord,
	AccountingJobRunsService,
} from "../accounting-job-runs.service";
import { ComplianceRoadmapSnapshotService } from "../compliance-roadmap-snapshot.service";
import { ComplianceRoadmapService } from "../compliance-roadmap.service";

describe("ComplianceRoadmapService.runRoadmapAction", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("queues one-click prepare-sire action with country pack context", async () => {
		vi.spyOn(
			ComplianceRoadmapSnapshotService,
			"getRoadmapMvpSnapshot",
		).mockResolvedValue(
			buildSnapshot([
				{
					id: "prepare-sire",
					traceId: "trace-1",
					recommendedAt: "2026-03-20T10:00:00.000Z",
					title: "Prepare SIRE package with approval gate",
					description: "4 SUNAT-pending documents detected.",
					impact: "Reduces filing risk.",
					confidence: 0.91,
					automationLevel: "one-click",
				},
			]),
		);

		const createRunSpy = vi
			.spyOn(AccountingJobRunsService, "createRun")
			.mockResolvedValue(buildRunRecord("run-prepare-sire"));

		const result = await ComplianceRoadmapService.runRoadmapAction({
			companyId: "cmp-1",
			year: 2026,
			month: 3,
			actionId: "prepare-sire",
			traceId: "trace-1",
			countryCode: "mx",
		});

		expect(createRunSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-1",
				countryCode: "mx",
				jobId: "prepare-sire",
				inputPayload: expect.objectContaining({
					period: "2026-03",
					source: "roadmap-mvp",
					traceId: "trace-1",
					actionId: "prepare-sire",
				}),
			}),
		);

		expect(result).toMatchObject({
			actionId: "prepare-sire",
			execution: "QUEUED_FOR_APPROVAL",
			runId: "run-prepare-sire",
			runStatus: "AWAITING_APPROVAL",
		});
	});

	it("returns review-required result for non automated actions", async () => {
		vi.spyOn(
			ComplianceRoadmapSnapshotService,
			"getRoadmapMvpSnapshot",
		).mockResolvedValue(
			buildSnapshot([
				{
					id: "collect-overdue-invoices",
					traceId: "trace-1",
					recommendedAt: "2026-03-20T10:00:00.000Z",
					title: "Prioritize overdue collections",
					description: "2 overdue invoices detected.",
					impact: "Improves liquidity.",
					confidence: 0.84,
					automationLevel: "review-required",
				},
			]),
		);

		const createRunSpy = vi.spyOn(AccountingJobRunsService, "createRun");

		const result = await ComplianceRoadmapService.runRoadmapAction({
			companyId: "cmp-1",
			year: 2026,
			month: 3,
			actionId: "collect-overdue-invoices",
			traceId: "trace-1",
		});

		expect(createRunSpy).not.toHaveBeenCalled();
		expect(result).toEqual({
			actionId: "collect-overdue-invoices",
			execution: "REVIEW_REQUIRED",
			message: "Action prepared for guided execution in the copilot workflow.",
		});
	});

	it("throws roadmap action not available when action is absent in snapshot", async () => {
		vi.spyOn(
			ComplianceRoadmapSnapshotService,
			"getRoadmapMvpSnapshot",
		).mockResolvedValue(
			buildSnapshot([
				{
					id: "prepare-sire",
					traceId: "trace-1",
					recommendedAt: "2026-03-20T10:00:00.000Z",
					title: "Prepare SIRE package with approval gate",
					description: "4 SUNAT-pending documents detected.",
					impact: "Reduces filing risk.",
					confidence: 0.91,
					automationLevel: "one-click",
				},
			]),
		);

		await expect(
			ComplianceRoadmapService.runRoadmapAction({
				companyId: "cmp-1",
				year: 2026,
				month: 3,
				actionId: "stabilize-cashflow",
				traceId: "trace-1",
			}),
		).rejects.toThrow("ROADMAP_ACTION_NOT_AVAILABLE");
	});

	it("fails when trace identifier does not match recommendation", async () => {
		vi.spyOn(
			ComplianceRoadmapSnapshotService,
			"getRoadmapMvpSnapshot",
		).mockResolvedValue(
			buildSnapshot([
				{
					id: "prepare-sire",
					traceId: "trace-expected",
					recommendedAt: "2026-03-20T10:00:00.000Z",
					title: "Prepare SIRE package with approval gate",
					description: "4 SUNAT-pending documents detected.",
					impact: "Reduces filing risk.",
					confidence: 0.91,
					automationLevel: "one-click",
				},
			]),
		);

		await expect(
			ComplianceRoadmapService.runRoadmapAction({
				companyId: "cmp-1",
				year: 2026,
				month: 3,
				actionId: "prepare-sire",
				traceId: "trace-invalid",
			}),
		).rejects.toThrow("ROADMAP_TRACE_MISMATCH");
	});
});

function buildSnapshot(
	actions: ComplianceRoadmapAction[],
): ComplianceRoadmapSnapshot {
	return {
		companyId: "cmp-1",
		period: "2026-03",
		generatedAt: "2026-03-20T10:00:00.000Z",
		phase1: {
			objective: "Most reliable accounting operation in Peru",
			reliabilityScore: 92.1,
			sunatStatus: "COMPLIANT",
			blockingIssues: 1,
			openIssues: 2,
			ledgerReproducible: true,
			reproducibilityCoverage: "COMPLETE_DATA",
			differences: {
				recordCount: 0,
				totalAmount: 0,
				totalIGV: 0,
			},
			nextFocus: ["Close critical and high-severity compliance findings."],
		},
		phase2: {
			objective: "Accounting copilot with actionable automation",
			insightScore: 84.5,
			periodIncome: 23000,
			periodExpense: 18000,
			cashflowGap: 5000,
			overdueInvoices: 2,
			pendingSunatInvoices: 4,
			recommendedActions: actions,
		},
	};
}

function buildRunRecord(id: string): AccountingJobRunRecord {
	const timestamp = new Date("2026-03-20T10:00:00.000Z");

	return {
		id,
		companyId: "cmp-1",
		countryCode: "mx",
		jobId: "prepare-sire",
		jobTitle: "Preparar SIRE",
		jobCategory: "compliance",
		status: "AWAITING_APPROVAL",
		approvalRequired: true,
		requestedBy: null,
		approvedBy: null,
		prompt: "Preparar SIRE del periodo actual",
		summary: "Roadmap MVP - preparar SIRE 2026-03",
		inputPayload: {
			period: "2026-03",
			source: "roadmap-mvp",
			traceId: "trace-1",
			actionId: "prepare-sire",
		},
		resultPayload: null,
		evidencePayload: null,
		startedAt: timestamp,
		completedAt: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}
