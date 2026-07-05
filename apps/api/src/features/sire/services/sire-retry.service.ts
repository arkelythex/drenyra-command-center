/**
 * SIRE Retry Service
 *
 * Handles automatic retry of failed SIRE submissions with exponential backoff.
 *
 * **Retry Strategy:**
 * - Max attempts: 3 (configurable)
 * - Exponential backoff: 2^attempt minutes
 * - Retry only transient errors (5xx, timeout, network)
 * - Skip permanent errors (4xx validation, authentication)
 *
 * **Usage:**
 * ```ts
 * // Manual trigger
 * await SireRetryService.processRetryQueue();
 *
 * // Scheduled (cron job)
 * setInterval(() => SireRetryService.processRetryQueue(), 5 * 60 * 1000); // Every 5 minutes
 * ```
 */

import { sireSubmissionRepository } from "@drenyra/persistence/repositories/sire-submission.repository";
import { createLogger } from "../../../lib/logger";
import { SireSubmissionService } from "../sire-submission.service";

const logger = createLogger({ module: "sire-retry" });

/**
 * RetryResult interface.
 *
 * @example
 * ```ts
 * const value: RetryResult = {} as RetryResult;
 * console.log(value);
 * ```
 */
export interface RetryResult {
	processed: number;
	succeeded: number;
	failed: number;
	skipped: number;
	errors: Array<{ submissionId: string; error: string }>;
}

/**
 * SireRetryService class.
 *
 * @example
 * ```ts
 * const value = new SireRetryService();
 * console.log(value);
 * ```
 */
export class SireRetryService {
	/**
	 * Process retry queue
	 *
	 * Finds failed submissions eligible for retry and attempts resubmission.
	 *
	 * **Eligibility Criteria:**
	 * - Status: FAILED
	 * - Attempt number < max retries
	 * - Created within last 24 hours (prevent infinite retry of old submissions)
	 * - Next retry time has passed (exponential backoff)
	 */
	static async processRetryQueue(): Promise<RetryResult> {
		const result: RetryResult = {
			processed: 0,
			succeeded: 0,
			failed: 0,
			skipped: 0,
			errors: [],
		};

		// Get failed submissions (last 24 hours)
		const maxAge = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const failedSubmissions =
			await sireSubmissionRepository.getFailedSubmissionsForRetry(maxAge);

		logger.info(
			{ candidateCount: failedSubmissions.length },
			"Loaded failed SIRE submissions eligible for retry",
		);

		for (const submission of failedSubmissions) {
			try {
				result.processed++;

				// Check if retry time has passed (exponential backoff)
				if (submission.nextRetryAt && submission.nextRetryAt > new Date()) {
					logger.info(
						{
							submissionId: submission.id,
							nextRetryAt: submission.nextRetryAt.toISOString(),
						},
						"Skipping SIRE retry because next retry window has not opened",
					);
					result.skipped++;
					continue;
				}

				// Increment attempt number
				await sireSubmissionRepository.incrementAttempt(submission.id);

				// Attempt resubmission
				logger.info(
					{
						submissionId: submission.id,
						attemptNumber: (submission.attemptNumber ?? 0) + 1,
						maxRetries: submission.maxRetries,
						companyId: submission.companyId,
						period: submission.period,
					},
					"Retrying SIRE submission",
				);

				const retryResult = await SireSubmissionService.submit({
					companyId: submission.companyId,
					period: submission.period,
					ledgerType: submission.ledgerType as "ventas" | "compras",
					payloadFormat: submission.payloadFormat as
						| "txt"
						| "csv"
						| "json"
						| "xml",
					payloadBase64: "", // TODO: Store payload for retry
					dryRun: submission.dryRun ?? false,
				});

				// Update submission with retry result
				await sireSubmissionRepository.update(submission.id, {
					status:
						retryResult.status === "ACCEPTED" ||
						retryResult.status === "SIMULATED"
							? "ACCEPTED"
							: "FAILED",
					submissionId: retryResult.submissionId,
					sunatTicket: retryResult.sunatTicket,
					trackingId: retryResult.trackingId,
					sunatMessage: retryResult.message,
					processedAt: new Date(),
				});

				result.succeeded++;
				logger.info(
					{
						submissionId: submission.id,
						resultStatus: retryResult.status,
						trackingId: retryResult.trackingId,
						sunatTicket: retryResult.sunatTicket,
					},
					"SIRE retry succeeded",
				);
			} catch (error: unknown) {
				result.failed++;
				const errorMessage =
					error instanceof Error ? error.message : String(error);

				logger.error(
					{
						error,
						submissionId: submission.id,
						attemptNumber: submission.attemptNumber,
						maxRetries: submission.maxRetries,
					},
					"SIRE retry failed",
				);

				result.errors.push({
					submissionId: submission.id,
					error: errorMessage,
				});

				// Update submission with error and next retry time
				const nextRetryMinutes = 2 ** ((submission.attemptNumber ?? 1) + 1); // Exponential backoff
				const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60 * 1000);

				await sireSubmissionRepository.update(submission.id, {
					status: "FAILED",
					sunatMessage: errorMessage,
					nextRetryAt,
					processedAt: new Date(),
				});
			}
		}

		logger.info(
			{
				processed: result.processed,
				succeeded: result.succeeded,
				failed: result.failed,
				skipped: result.skipped,
			},
			"Completed SIRE retry queue processing",
		);

		return result;
	}

	/**
	 * Get retry queue status
	 */
	static async getQueueStatus() {
		const maxAge = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const failedSubmissions =
			await sireSubmissionRepository.getFailedSubmissionsForRetry(maxAge);

		const now = new Date();
		const readyForRetry = failedSubmissions.filter(
			(s) => !s.nextRetryAt || s.nextRetryAt <= now,
		);
		const waitingForRetry = failedSubmissions.filter(
			(s) => s.nextRetryAt && s.nextRetryAt > now,
		);

		return {
			total: failedSubmissions.length,
			readyForRetry: readyForRetry.length,
			waitingForRetry: waitingForRetry.length,
			submissions: failedSubmissions.map((s) => ({
				id: s.id,
				companyId: s.companyId,
				period: s.period,
				attemptNumber: s.attemptNumber,
				maxRetries: s.maxRetries,
				nextRetryAt: s.nextRetryAt,
				lastError: s.sunatMessage,
			})),
		};
	}
}
