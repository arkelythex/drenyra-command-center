import type { ContextRegistrySurfaceDTO } from "@drenyra/application";
import {
	type AccountingJobDefinition,
	getAccountingJobs,
} from "../../../lib/accounting-jobs";
import {
	CONTEXT_REGISTRY_SEEDS,
	type ContextRegistrySeed,
	type ContextRegistrySurface,
	type ControlPlaneSurfaceId,
} from "./context-registry.types";

function buildJobLookup(): Map<string, AccountingJobDefinition> {
	return new Map(getAccountingJobs("pe").map((job) => [job.id, job]));
}

function buildSurface(
	seed: ContextRegistrySeed,
	jobs: Map<string, AccountingJobDefinition>,
): ContextRegistrySurfaceDTO {
	const job = jobs.get(seed.surfaceId);
	if (!job) {
		throw new Error(
			`Missing accounting job catalog entry for '${seed.surfaceId}'.`,
		);
	}

	if (job.surfaceId && job.surfaceId !== seed.surfaceId) {
		throw new Error(
			`Accounting job '${job.id}' is mapped to '${job.surfaceId}', expected '${seed.surfaceId}'.`,
		);
	}

	return {
		surfaceId: seed.surfaceId,
		jobId: job.id,
		title: job.title,
		description: job.description,
		tenantScope:
			seed.tenantScope === "portfolio" ? "portfolio" : "organization",
		approvalsRequired: [...seed.approvalsRequired],
		allowedTools: [...seed.allowedTools],
		allowedCorpora: [...seed.allowedCorpora],
		retrievalDefault: seed.retrievalDefault,
		deterministicFallback: seed.deterministicFallback,
		contextWindow: seed.contextWindow,
	};
}

export class ContextControlPlaneRegistry {
	private readonly surfaces = new Map<
		ControlPlaneSurfaceId,
		ContextRegistrySurface
	>();

	constructor(surfaces: readonly ContextRegistrySurface[]) {
		for (const surface of surfaces) {
			this.register(surface);
		}
	}

	register(surface: ContextRegistrySurface): void {
		if (this.surfaces.has(surface.surfaceId as ControlPlaneSurfaceId)) {
			throw new Error(
				`Context surface '${surface.surfaceId}' is already registered.`,
			);
		}

		this.surfaces.set(surface.surfaceId as ControlPlaneSurfaceId, surface);
	}

	get(surfaceId: string): ContextRegistrySurface | null {
		return this.surfaces.get(surfaceId as ControlPlaneSurfaceId) ?? null;
	}

	list(): readonly ContextRegistrySurface[] {
		return Array.from(this.surfaces.values());
	}
}

export function createContextControlPlaneRegistry(
	seeds: readonly ContextRegistrySeed[] = CONTEXT_REGISTRY_SEEDS,
): ContextControlPlaneRegistry {
	const jobs = buildJobLookup();
	const surfaces = seeds.map((seed) => buildSurface(seed, jobs));
	return new ContextControlPlaneRegistry(surfaces);
}

export const contextControlPlaneRegistry = createContextControlPlaneRegistry();
