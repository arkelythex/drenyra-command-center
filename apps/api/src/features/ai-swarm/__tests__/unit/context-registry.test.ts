import { describe, expect, it } from "vitest";
import {
	contextControlPlaneRegistry,
	createContextControlPlaneRegistry,
} from "../../context-control-plane/context-registry";
import {
	CONTEXT_REGISTRY_SEEDS,
	CONTROL_PLANE_SURFACE_IDS,
} from "../../context-control-plane/context-registry.types";

describe("ContextControlPlaneRegistry", () => {
	it("registers the baseline supervised surfaces from the accounting job catalog", () => {
		const surfaces = contextControlPlaneRegistry.list();
		const ids = surfaces.map((surface) => surface.surfaceId);

		expect(ids).toEqual([
			CONTROL_PLANE_SURFACE_IDS.PREPARE_SIRE,
			CONTROL_PLANE_SURFACE_IDS.BANK_RECONCILIATION,
			CONTROL_PLANE_SURFACE_IDS.VALIDATE_CPE,
		]);

		expect(
			contextControlPlaneRegistry.get(CONTROL_PLANE_SURFACE_IDS.PREPARE_SIRE)
				?.jobId,
		).toBe("prepare-sire");
		expect(
			contextControlPlaneRegistry.get(
				CONTROL_PLANE_SURFACE_IDS.BANK_RECONCILIATION,
			)?.deterministicFallback.strategyId,
		).toBe("bank-reconciliation-deterministic");
	});

	it("prevents duplicate surface registration", () => {
		expect(() =>
			createContextControlPlaneRegistry([
				CONTEXT_REGISTRY_SEEDS[0],
				CONTEXT_REGISTRY_SEEDS[0],
			]),
		).toThrow("Context surface 'prepare-sire' is already registered.");
	});

	it("keeps expansion guardrails bounded to the baseline supervised surfaces", () => {
		const surfaces = contextControlPlaneRegistry.list();

		expect(surfaces).toHaveLength(3);

		for (const surface of surfaces) {
			if (surface.allowedCorpora.length === 0) {
				continue;
			}

			expect(surface.retrievalDefault).toBe("hybrid-documentary");
			expect(
				surface.allowedCorpora.every((corpus) => corpus.kind === "documentary"),
			).toBe(true);
		}
	});
});
