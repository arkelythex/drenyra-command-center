import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api, getLegacyUserId } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	readRecord,
	readString,
	readDocumentarySources,
	readEvaluationSummary,
	readRetrievalMode,
	inferApprovalState,
	readLocalControlPlanePayload,
	resolveControlPlaneSnapshot,
	ControlPlanePayloadRecord,
	AccountingJobRunView,
	mapRawRunToView,
	mapRunViewWithControlPlane,
	RawAccountingJobRunRecord,
	ContextRegistrySurfaceDTO,
	ControlPlaneRunSnapshot,
} from "../lib/accounting-job-run-utils";
import type { AssistantAccountingJob } from "./useAccountingJobsCatalog";

type ControlPlaneApi = typeof import("../api/context-control-plane.api");

let controlPlaneApiPromise: Promise<ControlPlaneApi> | null = null;

function loadControlPlaneApi(): Promise<ControlPlaneApi> {
	controlPlaneApiPromise ??= import("../api/context-control-plane.api");
	return controlPlaneApiPromise;
}

interface UseAccountingJobRunsOptions {
	includeControlPlane?: boolean;
}

export function useAccountingJobRuns(
	limit = 8,
	options: UseAccountingJobRunsOptions = {},
) {
	const queryClient = useQueryClient();
	const { companyContext } = useActiveCompanyContext();
	const includeControlPlane = options.includeControlPlane ?? true;

	const listQuery = useQuery({
		queryKey: [
			"assistant-accounting-job-runs",
			companyContext.companyId,
			companyContext.countryCode,
			limit,
		],
		queryFn: async () => {
			const body = await unwrap(
				api.compliance["accounting-job-runs"].get({
					query: {
						companyId: companyContext.companyId,
						countryCode: companyContext.countryCode,
						limit,
					},
				} as never),
			).catch(() => null);

			if (body === null) {
				return [] as AccountingJobRunView[];
			}

			let listPayload: { runs?: RawAccountingJobRunRecord[] };
			try {
				listPayload = extractOkData(
					body,
					"No se pudo cargar la actividad contable",
				) as { runs?: RawAccountingJobRunRecord[] };
			} catch {
				return [] as AccountingJobRunView[];
			}

			return ((listPayload.runs ?? []) as RawAccountingJobRunRecord[]).map(
				(run) => mapRawRunToView(run),
			);
		},
		staleTime: 1000 * 20,
	});

	const baseRuns = listQuery.data ?? [];
	const baseRunIds = useMemo(() => baseRuns.map((run) => run.id), [baseRuns]);
	const baseRunIdSignature = useMemo(
		() => baseRunIds.join("\u001F"),
		[baseRunIds],
	);
	const controlPlaneQuery = useQuery({
		queryKey: [
			"assistant-accounting-job-runs-control-plane",
			companyContext.companyId,
			companyContext.countryCode,
			limit,
			baseRunIdSignature,
		],
		enabled: includeControlPlane && baseRuns.length > 0,
		queryFn: async () => {
			const controlPlaneApi = await loadControlPlaneApi();
			const registry = await controlPlaneApi
				.getControlPlaneRegistry(companyContext.companyId)
				.catch(() => ({
					companyId: companyContext.companyId,
					count: 0,
					surfaces: [] as ContextRegistrySurfaceDTO[],
				}));

			const surfaceById = new Map<string, ContextRegistrySurfaceDTO>(
				registry.surfaces.map((surface: ContextRegistrySurfaceDTO) => [
					surface.surfaceId,
					surface,
				]),
			);

			return new Map<string, ControlPlaneRunSnapshot | null>(
				await Promise.all(
					baseRuns.map(
						async (run) =>
							[
								run.id,
								await resolveControlPlaneSnapshot(
									run,
									surfaceById,
									controlPlaneApi,
								),
							] as const,
					),
				),
			);
		},
		staleTime: 1000 * 20,
	});
	const controlPlaneByRunId = includeControlPlane
		? controlPlaneQuery.data
		: undefined;
	const runs = includeControlPlane
		? baseRuns.map((run) =>
				mapRunViewWithControlPlane(
					run,
					controlPlaneByRunId?.get(run.id) ?? null,
				),
			)
		: baseRuns;
	const invalidateRunQueries = async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: ["assistant-accounting-job-runs", companyContext.companyId],
			}),
			queryClient.invalidateQueries({
				queryKey: [
					"assistant-accounting-job-runs-control-plane",
					companyContext.companyId,
				],
			}),
		]);
	};

	const createMutation = useMutation({
		mutationFn: async (input: {
			job: AssistantAccountingJob;
			promptOverride?: string;
			summary?: string;
			inputPayload?: Record<string, unknown>;
		}) => {
			const body = await unwrap(
				api.compliance["accounting-job-runs"].post({
					companyId: companyContext.companyId,
					countryCode: companyContext.countryCode,
					jobId: input.job.id,
					requestedBy: getLegacyUserId(),
					prompt: input.promptOverride ?? input.job.prompt,
					summary: input.summary,
					inputPayload: input.inputPayload,
				} as never),
			);
			const created = extractOkData(
				body,
				"No se pudo registrar el trabajo contable",
			) as RawAccountingJobRunRecord;

			return {
				...created,
				controlPlane: null,
			} satisfies AccountingJobRunView;
		},
		onSuccess: invalidateRunQueries,
	});

	const updateMutation = useMutation({
		mutationFn: async (input: {
			runId: string;
			status: AccountingJobRunView["status"];
			summary?: string;
			approvedBy?: string;
			resultPayload?: Record<string, unknown>;
			evidencePayload?: Record<string, unknown>;
		}) => {
			const body = await unwrap(
				api.compliance["accounting-job-runs"]({
					id: input.runId,
				}).status.patch({
					companyId: companyContext.companyId,
					status: input.status,
					summary: input.summary,
					approvedBy: input.approvedBy,
					resultPayload: input.resultPayload,
					evidencePayload: input.evidencePayload,
				} as never),
			);
			const updated = extractOkData(
				body,
				"No se pudo actualizar el trabajo contable",
			) as RawAccountingJobRunRecord;

			return {
				...updated,
				controlPlane: null,
			} satisfies AccountingJobRunView;
		},
		onSuccess: invalidateRunQueries,
	});

	const executeMutation = useMutation({
		mutationFn: async (input: { runId: string; period?: string }) => {
			const body = await unwrap(
				api.compliance["accounting-job-runs"]({
					id: input.runId,
				}).execute.post({
					companyId: companyContext.companyId,
					period: input.period,
				} as never),
			);
			const executed = extractOkData(
				body,
				"No se pudo ejecutar el trabajo contable",
			) as RawAccountingJobRunRecord;

			return {
				...executed,
				controlPlane: null,
			} satisfies AccountingJobRunView;
		},
		onSuccess: invalidateRunQueries,
	});

	return {
		runs,
		isLoadingRuns: listQuery.isLoading,
		createJobRun: createMutation.mutateAsync,
		isCreatingJobRun: createMutation.isPending,
		updateJobRunStatus: updateMutation.mutateAsync,
		isUpdatingJobRun: updateMutation.isPending,
		executeJobRun: executeMutation.mutateAsync,
		isExecutingJobRun: executeMutation.isPending,
	};
}
