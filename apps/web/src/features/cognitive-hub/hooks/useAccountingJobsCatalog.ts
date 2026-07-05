import type { ContextRegistrySurfaceDTO } from "@drenyra/application";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import {
	type CountryAssistantQuickAction,
	type CountryCode,
	getCountryPack,
} from "@/lib/latam-country-packs";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { getControlPlaneRegistry } from "../api/context-control-plane.api";

export interface AssistantAccountingJob {
	id: string;
	surfaceId?: string;
	title: string;
	description: string;
	prompt: string;
	category:
		| "reconciliation"
		| "compliance"
		| "closing"
		| "collections"
		| "payables";
	cadence: "daily" | "weekly" | "monthly" | "on-demand";
	approvalRequired: boolean;
	controlPlaneSurface: ContextRegistrySurfaceDTO | null;
}

interface AccountingJobsCatalogResponse {
	countryCode: CountryCode;
	jobs: AssistantAccountingJob[];
	registrySurfaces: ContextRegistrySurfaceDTO[];
}

function buildFallbackJobs(
	countryCode?: CountryCode | string | null,
): AccountingJobsCatalogResponse {
	const pack = getCountryPack(countryCode);

	return {
		countryCode: pack.code,
		jobs: pack.assistantQuickActions.map(
			(action: CountryAssistantQuickAction, index: number) => ({
				id: `${pack.code}-fallback-${index + 1}`,
				title: action.label,
				description: action.command,
				prompt: action.command,
				category:
					index === 0
						? "compliance"
						: index === 3
							? "reconciliation"
							: "closing",
				cadence: index === 0 ? "monthly" : "on-demand",
				approvalRequired: action.emphasis === "high",
				controlPlaneSurface: null,
			}),
		),
		registrySurfaces: [],
	};
}

function mergeJobsWithRegistry(
	jobs: AssistantAccountingJob[],
	surfaces: ContextRegistrySurfaceDTO[],
): AssistantAccountingJob[] {
	const surfaceByJobId = new Map(
		surfaces.map((surface) => [surface.jobId, surface]),
	);

	return jobs.map((job) => {
		const matchedSurface = surfaceByJobId.get(job.id) ?? null;

		return {
			...job,
			surfaceId: matchedSurface?.surfaceId ?? job.surfaceId,
			approvalRequired: matchedSurface
				? matchedSurface.approvalsRequired.length > 0
				: job.approvalRequired,
			controlPlaneSurface: matchedSurface,
		};
	});
}

export function useAccountingJobsCatalog(
	countryCode?: CountryCode | string | null,
) {
	const { companyContext } = useActiveCompanyContext();

	return useQuery({
		queryKey: [
			"assistant-accounting-jobs",
			companyContext.companyId,
			countryCode ?? "default",
		],
		queryFn: async () => {
			const [body, registry] = await Promise.all([
				unwrap(
					api.compliance["accounting-jobs"].get({
						query: {
							countryCode: countryCode ?? undefined,
						},
					} as never),
				).catch(() => null),
				getControlPlaneRegistry(companyContext.companyId).catch(() => ({
					companyId: companyContext.companyId,
					count: 0,
					surfaces: [] as ContextRegistrySurfaceDTO[],
				})),
			]);

			const withFallback = () => {
				const fallback = buildFallbackJobs(countryCode);
				return {
					...fallback,
					jobs: mergeJobsWithRegistry(fallback.jobs, registry.surfaces),
					registrySurfaces: registry.surfaces,
				};
			};

			if (body === null) {
				return withFallback();
			}

			try {
				const payload = extractOkData(body, "accounting-jobs.catalog") as {
					countryCode: CountryCode;
					jobs: AssistantAccountingJob[];
				};
				return {
					countryCode: payload.countryCode,
					jobs: mergeJobsWithRegistry(payload.jobs, registry.surfaces),
					registrySurfaces: registry.surfaces,
				};
			} catch {
				return withFallback();
			}
		},
		staleTime: 1000 * 60 * 15,
		gcTime: 1000 * 60 * 30,
		retry: 1,
		placeholderData: () => buildFallbackJobs(countryCode),
	});
}
