import { sunatKnowledgeService } from "@drenyra/ai/services/sunat-knowledge";
import type {
	ContextEvaluationSummaryDTO,
	ContextRunStateDTO,
	ContextTraceRecordDTO,
} from "@drenyra/application";
import { db } from "@drenyra/persistence/client";
import { and, desc, eq } from "@drenyra/persistence/query";
import { accountingJobRuns } from "@drenyra/persistence/schema";
import { contextAuditService } from "../../features/ai-swarm/context-control-plane/context-audit.service";
import { contextEvaluationService } from "../../features/ai-swarm/context-control-plane/context-evaluation.service";
import { contextPolicyService } from "../../features/ai-swarm/context-control-plane/context-policy.service";
import { getControlPlaneJobMetadata } from "../../features/ai-swarm/context-control-plane/control-plane-job-metadata";
import { SireRegisterExportService } from "../../features/sire/services/sire-register-export.service";
import { getAccountingJobs } from "../../lib/accounting-jobs";
import {
	ACCOUNTING_JOB_ERRORS,
	ACCOUNTING_JOB_RUN_TRANSITIONS,
	type AccountingJobRunControlPlaneSnapshot,
	type AccountingJobRunRecord,
	type AccountingJobRunStatus,
	isTerminalAccountingJobRunStatus,
	readControlPlaneSnapshot,
	readObjectRecord,
	SUPPORTED_EXECUTABLE_JOBS,
	type SupportedExecutableJob,
	toApprovalState,
	writeControlPlaneSnapshot,
} from "./types";

export class AccountingJobRunsService {
	static async getRun(input: {
		id: string;
		companyId: string;
	}): Promise<AccountingJobRunRecord | null> {
		const [run] = await db
			.select()
			.from(accountingJobRuns)
			.where(
				and(
					eq(accountingJobRuns.id, input.id),
					eq(accountingJobRuns.companyId, input.companyId),
				),
			)
			.limit(1);

		return (run as AccountingJobRunRecord | undefined) ?? null;
	}

	static async createRun(input: {
		companyId: string;
		countryCode?: string | null;
		jobId: string;
		requestedBy?: string | null;
		prompt?: string | null;
		summary?: string | null;
		inputPayload?: Record<string, unknown>;
		traceId?: string;
		requestedTools?: string[];
		requestedCorpora?: string[];
	}): Promise<AccountingJobRunRecord> {
		const jobs = getAccountingJobs(input.countryCode);
		const definition = jobs.find((job) => job.id === input.jobId);

		if (!definition) {
			throw new Error(ACCOUNTING_JOB_ERRORS.NOT_SUPPORTED);
		}

		const metadata = getControlPlaneJobMetadata(definition.id);
		const baseInputPayload = readObjectRecord(input.inputPayload ?? {});
		let nextInputPayload: Record<string, unknown> = baseInputPayload;

		if (metadata) {
			const requestedCorpora =
				input.requestedCorpora && input.requestedCorpora.length > 0
					? input.requestedCorpora
					: [...metadata.defaultRequestedCorpora];
			const policy = contextPolicyService.resolve({
				surfaceId: metadata.surfaceId,
				tenantId: input.companyId,
				traceId: input.traceId,
				requestedTools: input.requestedTools,
				requestedCorpora,
			});

			if (!policy.allowed) {
				throw new Error(ACCOUNTING_JOB_ERRORS.POLICY_VIOLATION);
			}

			const traceRecord = contextAuditService.recordPolicyResolution({
				request: {
					surfaceId: metadata.surfaceId,
					tenantId: input.companyId,
					traceId: input.traceId,
					requestedTools: input.requestedTools,
					requestedCorpora,
				},
				response: policy,
				runId: policy.traceId,
			});

			nextInputPayload = writeControlPlaneSnapshot(baseInputPayload, {
				traceId: policy.traceId,
				surfaceId: metadata.surfaceId,
				contextPolicyId: `${metadata.surfaceId}:${policy.traceId}`,
				requestedTools: input.requestedTools ?? [],
				requestedCorpora,
				policy,
				traceRecords: [traceRecord],
				evaluationSummary: null,
				documentarySources: [],
				representativePath: metadata.representativePath,
				auditLinked: true,
				executionMode: "queued",
			});
		}

		const [created] = await db
			.insert(accountingJobRuns)
			.values({
				companyId: input.companyId,
				countryCode: input.countryCode ?? "pe",
				jobId: definition.id,
				jobTitle: definition.title,
				jobCategory: definition.category,
				status: definition.approvalRequired ? "AWAITING_APPROVAL" : "QUEUED",
				approvalRequired: definition.approvalRequired,
				requestedBy: input.requestedBy ?? null,
				prompt: input.prompt?.trim() || definition.prompt,
				summary: input.summary?.trim() || null,
				inputPayload: nextInputPayload,
			})
			.returning();

		return created as AccountingJobRunRecord;
	}

	static async listRuns(input: {
		companyId: string;
		countryCode?: string | null;
		status?: AccountingJobRunStatus | null;
		limit?: number;
	}): Promise<AccountingJobRunRecord[]> {
		const clauses = [eq(accountingJobRuns.companyId, input.companyId)];

		if (input.countryCode) {
			clauses.push(eq(accountingJobRuns.countryCode, input.countryCode));
		}

		if (input.status) {
			clauses.push(eq(accountingJobRuns.status, input.status));
		}

		const rows = await db
			.select()
			.from(accountingJobRuns)
			.where(and(...clauses))
			.orderBy(desc(accountingJobRuns.createdAt))
			.limit(input.limit ?? 20);

		return rows as AccountingJobRunRecord[];
	}

	static async updateRunStatus(input: {
		id: string;
		companyId: string;
		status: AccountingJobRunStatus;
		summary?: string | null;
		approvedBy?: string | null;
		inputPayload?: Record<string, unknown>;
		resultPayload?: Record<string, unknown> | null;
		evidencePayload?: Record<string, unknown> | null;
	}): Promise<AccountingJobRunRecord> {
		const current = await AccountingJobRunsService.getRun({
			id: input.id,
			companyId: input.companyId,
		});

		if (!current) {
			throw new Error(ACCOUNTING_JOB_ERRORS.RUN_NOT_FOUND);
		}

		const isSameStatus = current.status === input.status;
		const allowedTransitions =
			ACCOUNTING_JOB_RUN_TRANSITIONS[
				current.status as AccountingJobRunStatus
			] ?? [];

		if (!isSameStatus && !allowedTransitions.includes(input.status)) {
			throw new Error(ACCOUNTING_JOB_ERRORS.INVALID_TRANSITION);
		}

		const nextCompletedAt = isTerminalAccountingJobRunStatus(input.status)
			? (current.completedAt ?? new Date())
			: current.completedAt;

		const [updated] = await db
			.update(accountingJobRuns)
			.set({
				status: input.status,
				summary:
					input.summary === undefined
						? current.summary
						: input.summary?.trim() || null,
				approvedBy:
					input.approvedBy === undefined
						? current.approvedBy
						: input.approvedBy,
				inputPayload:
					input.inputPayload === undefined
						? current.inputPayload
						: input.inputPayload,
				resultPayload:
					input.resultPayload === undefined
						? current.resultPayload
						: input.resultPayload,
				evidencePayload:
					input.evidencePayload === undefined
						? current.evidencePayload
						: input.evidencePayload,
				completedAt: nextCompletedAt,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(accountingJobRuns.id, input.id),
					eq(accountingJobRuns.companyId, input.companyId),
				),
			)
			.returning();

		return updated as AccountingJobRunRecord;
	}

	static async getContextRunState(input: {
		id: string;
		companyId: string;
	}): Promise<ContextRunStateDTO | null> {
		const run = await AccountingJobRunsService.getRun(input);
		if (!run) {
			return null;
		}

		const snapshot = readControlPlaneSnapshot(
			readObjectRecord(run.inputPayload),
		);
		if (!snapshot?.traceId) {
			throw new Error(ACCOUNTING_JOB_ERRORS.TRACE_ID_REQUIRED);
		}

		return {
			runId: run.id,
			traceId: snapshot.traceId,
			surfaceId: snapshot.surfaceId,
			approvalState: toApprovalState(run),
			retrievalMode: snapshot.policy.retrievalMode,
			contextWindow: snapshot.policy.contextWindow ?? {
				maxMemoryItems: 0,
				maxDocumentResults: 0,
				maxToolCalls: 0,
			},
			evaluationSummary: snapshot.evaluationSummary,
		};
	}

	static async getContextTrace(input: {
		id: string;
		companyId: string;
	}): Promise<ContextTraceRecordDTO[]> {
		const run = await AccountingJobRunsService.getRun(input);
		if (!run) {
			throw new Error(ACCOUNTING_JOB_ERRORS.RUN_NOT_FOUND);
		}

		const snapshot = readControlPlaneSnapshot(
			readObjectRecord(run.inputPayload),
		);
		if (!snapshot?.traceId) {
			throw new Error(ACCOUNTING_JOB_ERRORS.TRACE_ID_REQUIRED);
		}

		return snapshot.traceRecords;
	}

	static async getContextEvaluationSummary(input: {
		id: string;
		companyId: string;
	}): Promise<ContextEvaluationSummaryDTO | null> {
		const run = await AccountingJobRunsService.getRun(input);
		if (!run) {
			throw new Error(ACCOUNTING_JOB_ERRORS.RUN_NOT_FOUND);
		}

		const snapshot = readControlPlaneSnapshot(
			readObjectRecord(run.inputPayload),
		);
		if (!snapshot?.traceId) {
			throw new Error(ACCOUNTING_JOB_ERRORS.TRACE_ID_REQUIRED);
		}

		return snapshot.evaluationSummary;
	}

	static async executeRepresentativeSupervisedRun(input: {
		id: string;
		companyId: string;
		period?: string | null;
		approvedBy?: string | null;
	}): Promise<AccountingJobRunRecord> {
		const run = await AccountingJobRunsService.getRun({
			id: input.id,
			companyId: input.companyId,
		});
		if (!run) {
			throw new Error(ACCOUNTING_JOB_ERRORS.RUN_NOT_FOUND);
		}

		if (
			!SUPPORTED_EXECUTABLE_JOBS.includes(run.jobId as SupportedExecutableJob)
		) {
			throw new Error(ACCOUNTING_JOB_ERRORS.EXECUTION_NOT_SUPPORTED);
		}

		const snapshot = readControlPlaneSnapshot(
			readObjectRecord(run.inputPayload),
		);
		if (!snapshot?.traceId) {
			throw new Error(ACCOUNTING_JOB_ERRORS.TRACE_ID_REQUIRED);
		}

		if (run.status === "AWAITING_APPROVAL") {
			throw new Error(ACCOUNTING_JOB_ERRORS.REQUIRES_APPROVAL);
		}

		if (run.status === "COMPLETED") {
			return run;
		}

		const period =
			input.period?.trim() ||
			String(readObjectRecord(run.inputPayload).period ?? "");
		if (!period) {
			throw new Error(ACCOUNTING_JOB_ERRORS.PERIOD_REQUIRED);
		}

		const [yearValue, monthValue] = period.split("-");
		const year = Number(yearValue);
		const month = Number(monthValue);

		if (!Number.isInteger(year) || !Number.isInteger(month)) {
			throw new Error(ACCOUNTING_JOB_ERRORS.PERIOD_REQUIRED);
		}

		const documentaryCorpora =
			snapshot.requestedCorpora.length > 0
				? snapshot.requestedCorpora
				: snapshot.policy.allowedCorpora;
		const documentaryContext = documentaryCorpora.includes("sunat-sire-manuals")
			? await sunatKnowledgeService.buildDocumentaryContext({
					query: `SIRE ${period} validación de registros y alertas`,
					categories: ["sire"],
					limit: Math.max(
						snapshot.policy.contextWindow?.maxDocumentResults ?? 1,
						1,
					),
					corpusId: "sunat-sire-manuals",
				})
			: null;

		const [salesExport, purchasesExport] = await Promise.all([
			SireRegisterExportService.generateSalesRegister({
				year,
				month,
				companyId: input.companyId,
				format: "TXT",
			}),
			SireRegisterExportService.generatePurchasesRegister({
				year,
				month,
				companyId: input.companyId,
				format: "TXT",
			}),
		]);

		const salesContent =
			typeof salesExport === "string"
				? salesExport
				: salesExport.toString("utf-8");
		const purchasesContent =
			typeof purchasesExport === "string"
				? purchasesExport
				: purchasesExport.toString("utf-8");

		const salesValidation = SireRegisterExportService.validateSIREFormat(
			salesContent,
			"sales",
		);
		const purchasesValidation = SireRegisterExportService.validateSIREFormat(
			purchasesContent,
			"purchases",
		);
		const warningCount =
			salesValidation.warnings.length + purchasesValidation.warnings.length;

		const evaluationSummary = contextEvaluationService.buildPrepareSireSummary({
			approvalRequired: run.approvalRequired,
			approvedBy: input.approvedBy ?? run.approvedBy,
			policy: snapshot.policy,
			warningCount,
			documentarySourceCount: documentaryContext?.sources.length ?? 0,
			allExportsValid: salesValidation.isValid && purchasesValidation.isValid,
			status: "COMPLETED",
		});

		const evaluationTrace = contextAuditService.recordEvaluation({
			traceId: snapshot.traceId,
			runId: run.id,
			surfaceId: snapshot.surfaceId,
			tenantId: run.companyId,
			evaluationSummary,
		});

		const nextSnapshot: AccountingJobRunControlPlaneSnapshot = {
			...snapshot,
			traceRecords: [...snapshot.traceRecords, evaluationTrace],
			evaluationSummary,
			documentarySources: documentaryContext?.sources ?? [],
			executionMode: "deterministic-fallback",
		};

		return AccountingJobRunsService.updateRunStatus({
			id: input.id,
			companyId: input.companyId,
			status: "COMPLETED",
			approvedBy: input.approvedBy ?? run.approvedBy,
			summary: `SIRE ${period} listo · ${salesValidation.recordCount} ventas · ${purchasesValidation.recordCount} compras`,
			resultPayload: {
				period,
				warningCount,
				sales: {
					recordCount: salesValidation.recordCount,
					warningCount: salesValidation.warnings.length,
					isValid: salesValidation.isValid,
				},
				purchases: {
					recordCount: purchasesValidation.recordCount,
					warningCount: purchasesValidation.warnings.length,
					isValid: purchasesValidation.isValid,
				},
				contextControlPlane: {
					traceId: snapshot.traceId,
					surfaceId: snapshot.surfaceId,
					contextPolicyId: snapshot.contextPolicyId,
					evaluationSummary,
				},
			},
			evidencePayload: {
				period,
				exports: {
					sales: {
						bytes: salesContent.length,
					},
					purchases: {
						bytes: purchasesContent.length,
					},
				},
				documentarySources: documentaryContext?.sources ?? [],
				contextControlPlane: {
					traceId: snapshot.traceId,
					surfaceId: snapshot.surfaceId,
					retrievalMode: snapshot.policy.retrievalMode,
					executionMode: "deterministic-fallback",
					auditLinked: true,
				},
			},
			inputPayload: writeControlPlaneSnapshot(
				readObjectRecord(run.inputPayload),
				nextSnapshot,
			),
		});
	}
}
