import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@drenyra/persistence/repositories/sire-submission.repository", () => ({
	sireSubmissionRepository: {
		getFailedSubmissionsForRetry: vi.fn(),
		incrementAttempt: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("../../sire-submission.service", () => ({
	SireSubmissionService: {
		submit: vi.fn(),
	},
}));

import { sireSubmissionRepository } from "@drenyra/persistence/repositories/sire-submission.repository";
import { SireRetryService } from "../../services/sire-retry.service";
import { SireSubmissionService } from "../../sire-submission.service";

describe("SireRetryService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("retries eligible failed submissions and marks them as accepted when retry succeeds", async () => {
		vi.mocked(
			sireSubmissionRepository.getFailedSubmissionsForRetry,
		).mockResolvedValue([
			{
				id: "sub-1",
				companyId: "cmp-1",
				period: "2026-02",
				ledgerType: "ventas",
				payloadFormat: "txt",
				dryRun: false,
				attemptNumber: 1,
				maxRetries: 3,
				nextRetryAt: null,
				payloadBase64: "dGVzdA==",
			},
		] as never);
		vi.mocked(sireSubmissionRepository.incrementAttempt).mockResolvedValue({
			id: "sub-1",
			attemptNumber: 2,
		} as never);
		vi.mocked(SireSubmissionService.submit).mockResolvedValue({
			submissionId: "SIM-123",
			status: "SIMULATED",
			provider: "simulation",
			submittedAt: "2026-02-13T00:00:00.000Z",
			period: "2026-02",
			ledgerType: "ventas",
			dryRun: false,
			message: "Retry simulated",
			trackingId: "trk-1",
			sunatTicket: "ticket-1",
		});

		const result = await SireRetryService.processRetryQueue();

		expect(result).toEqual({
			processed: 1,
			succeeded: 1,
			failed: 0,
			skipped: 0,
			errors: [],
		});
		expect(sireSubmissionRepository.incrementAttempt).toHaveBeenCalledWith(
			"sub-1",
		);
		expect(SireSubmissionService.submit).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-1",
				period: "2026-02",
				ledgerType: "ventas",
				payloadFormat: "txt",
				payloadBase64: "dGVzdA==",
			}),
		);
		expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
			expect.objectContaining({ companyId: "cmp-1" }),
			"sub-1",
			expect.objectContaining({
				status: "ACCEPTED",
				submissionId: "SIM-123",
				trackingId: "trk-1",
				sunatTicket: "ticket-1",
			}),
		);
	});

	it("skips submissions whose next retry window has not opened yet", async () => {
		vi.mocked(
			sireSubmissionRepository.getFailedSubmissionsForRetry,
		).mockResolvedValue([
			{
				id: "sub-future",
				companyId: "cmp-1",
				period: "2026-02",
				ledgerType: "ventas",
				payloadFormat: "txt",
				dryRun: false,
				attemptNumber: 1,
				maxRetries: 3,
				nextRetryAt: new Date(Date.now() + 60_000),
			},
		] as never);

		const result = await SireRetryService.processRetryQueue();

		expect(result).toEqual({
			processed: 1,
			succeeded: 0,
			failed: 0,
			skipped: 1,
			errors: [],
		});
		expect(sireSubmissionRepository.incrementAttempt).not.toHaveBeenCalled();
		expect(SireSubmissionService.submit).not.toHaveBeenCalled();
		expect(sireSubmissionRepository.update).not.toHaveBeenCalled();
	});

	it("records retry failures and schedules next retry with exponential backoff", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-20T10:00:00.000Z"));

		vi.mocked(
			sireSubmissionRepository.getFailedSubmissionsForRetry,
		).mockResolvedValue([
			{
				id: "sub-fail",
				companyId: "cmp-2",
				period: "2026-03",
				ledgerType: "compras",
				payloadFormat: "csv",
				dryRun: false,
				attemptNumber: 2,
				maxRetries: 3,
				nextRetryAt: null,
				payloadBase64: "Y3N2X2RhdGE=",
			},
		] as never);
		vi.mocked(sireSubmissionRepository.incrementAttempt).mockResolvedValue({
			id: "sub-fail",
			attemptNumber: 3,
		} as never);
		vi.mocked(SireSubmissionService.submit).mockRejectedValue(
			new Error("Temporary SUNAT timeout"),
		);

		const result = await SireRetryService.processRetryQueue();

		expect(result.processed).toBe(1);
		expect(result.succeeded).toBe(0);
		expect(result.failed).toBe(1);
		expect(result.skipped).toBe(0);
		expect(result.errors).toEqual([
			{ submissionId: "sub-fail", error: "Temporary SUNAT timeout" },
		]);
		expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
			expect.objectContaining({ companyId: "cmp-2" }),
			"sub-fail",
			expect.objectContaining({
				status: "FAILED",
				sunatMessage: "Temporary SUNAT timeout",
				nextRetryAt: new Date("2026-03-20T10:08:00.000Z"),
			}),
		);

		vi.useRealTimers();
	});

	// D.4.3: NULL payload → clear error, marked non-retryable
	it("skips retry and marks as non-retryable when payloadBase64 is NULL", async () => {
		vi.mocked(
			sireSubmissionRepository.getFailedSubmissionsForRetry,
		).mockResolvedValue([
			{
				id: "sub-no-payload",
				companyId: "cmp-3",
				period: "2026-04",
				ledgerType: "ventas",
				payloadFormat: "txt",
				dryRun: false,
				attemptNumber: 1,
				maxRetries: 3,
				nextRetryAt: null,
				payloadBase64: null,
			},
		] as never);

		const result = await SireRetryService.processRetryQueue();

		expect(result.processed).toBe(1);
		expect(result.succeeded).toBe(0);
		expect(result.skipped).toBe(1);
		expect(SireSubmissionService.submit).not.toHaveBeenCalled();
		expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
			expect.objectContaining({ companyId: "cmp-3" }),
			"sub-no-payload",
			expect.objectContaining({
				status: "FAILED",
				sunatMessage: "No stored payload available for resubmission",
			}),
		);
	});
});
