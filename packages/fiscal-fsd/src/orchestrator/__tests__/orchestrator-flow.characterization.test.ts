/**
 * Characterization tests for FiscalComplianceOrchestrator.run/resume/extractSubsystems,
 * frozen before splitting their duplicated phase loop. They pin the observable results,
 * messages and the artifacts saved per phase.
 */

import { describe, expect, it } from "vitest";
import { FiscalComplianceOrchestrator } from "../fiscal-compliance-orchestrator";
import type { FaseName, FiscalScope } from "../types";

const SCOPE: FiscalScope = {
	organizationId: "org-1",
	companyId: "comp-1",
	companyRuc: "20123456786",
	period: "2026-07",
};
const FASES: FaseName[] = [
	"solicitud",
	"analisis",
	"diseno",
	"plan",
	"migracion",
	"auditoria",
];
const OK = JSON.stringify({
	subsistemasAfectados: ["detracciones"],
	riesgos: [],
	gruposTareas: [],
	lineasEstimadasTotal: 100,
	tareasImplementadas: [],
	estadoGeneral: "COMPLETO",
});

type Opts = { mode?: "auto" | "interactive"; failOn?: FaseName };

function make(opts: Opts = {}) {
	const o = new FiscalComplianceOrchestrator({
		mode: opts.mode ?? "auto",
		artifactStore: "none",
		reviewBudget: 400,
	});
	// biome-ignore lint/suspicious/noExplicitAny: tests reach into collaborators
	const orch = o as any;
	orch.modelRouter.registerProvider("custom", (model: string) => {
		return async () => {
			if (model === opts.failOn) throw new Error(`down:${model}`);
			return OK;
		};
	});
	orch.modelRouter.updateAssignments(
		FASES.map((fase) => ({
			fase,
			provider: "custom" as const,
			model: fase,
			priority: 0,
			reason: "test",
		})),
	);
	return o;
}

describe("run()", () => {
	it("completes in auto mode and saves one artifact per phase", async () => {
		const o = make();
		const result = await o.run("chg-run-1", SCOPE, {});
		expect(result.status).toBe("COMPLETED");
		expect(result.message).toBe(
			"Pipeline de cumplimiento fiscal completado exitosamente",
		);
		// biome-ignore lint/suspicious/noExplicitAny: inspect the in-memory store
		const saved = await (o as any).artifactStore.loadAll("chg-run-1");
		expect([...saved.keys()]).toEqual(FASES);
		expect(saved.get("solicitud").status).toBe("SUCCESS");
	});

	it("stops with FAILED, the failing phase and its errors", async () => {
		const result = await make({ failOn: "analisis" }).run(
			"chg-run-2",
			SCOPE,
			{},
		);
		expect(result.status).toBe("FAILED");
		expect(result.blockedAtFase).toBe("analisis");
		expect(result.message).toBe(
			'Pipeline detenido en fase "analisis": LLM call failed: down:analisis',
		);
		expect(result.reasons).toEqual(["LLM call failed: down:analisis"]);
		expect([...(result.phaseArtifacts?.keys() ?? [])]).toEqual([
			"solicitud",
			"analisis",
		]);
	});

	it("waits for approval after the first phase in interactive mode", async () => {
		const result = await make({ mode: "interactive" }).run(
			"chg-run-3",
			SCOPE,
			{},
		);
		expect(result.status).toBe("AWAITING_APPROVAL");
		expect(result.blockedAtFase).toBe("solicitud");
		expect(result.message).toMatch(/^Fase "solicitud" completada\. /);
	});
});

describe("run() stop mapping", () => {
	it("maps a BLOCKED phase to a BLOCKED pipeline result", async () => {
		const o = make();
		// biome-ignore lint/suspicious/noExplicitAny: stub a single phase result
		const orch = o as any;
		const real = orch.executeFase.bind(orch);
		orch.executeFase = async (fase: FaseName, ...rest: unknown[]) =>
			fase === "analisis"
				? {
						status: "BLOCKED",
						output: null,
						gatesPassed: [],
						evidenceArtifacts: [],
						errors: ["gate said no"],
						confidence: 0,
					}
				: real(fase, ...rest);
		const result = await o.run("chg-blocked", SCOPE, {});
		expect(result.status).toBe("BLOCKED");
		expect(result.blockedAtFase).toBe("analisis");
		expect(result.message).toBe(
			'Pipeline detenido en fase "analisis": gate said no',
		);
		expect(result.reasons).toEqual(["gate said no"]);
	});
});

describe("resume()", () => {
	it("reports an already completed pipeline without re-running phases", async () => {
		const o = make();
		await o.run("chg-res-1", SCOPE, {});
		const result = await o.resume("chg-res-1", SCOPE, {});
		expect(result.status).toBe("COMPLETED");
		expect(result.message).toBe("Pipeline ya completado anteriormente");
	});

	it("continues from the first phase that has no SUCCESS artifact", async () => {
		const o = make({ mode: "interactive" });
		await o.run("chg-res-2", SCOPE, {}); // saves 'solicitud', awaits approval
		const result = await o.resume("chg-res-2", SCOPE, {});
		expect(result.status).toBe("AWAITING_APPROVAL");
		expect(result.blockedAtFase).toBe("analisis");
		expect(result.message).toMatch(
			/^Reanudación: fase "analisis" completada\. /,
		);
	});

	it("stops with FAILED and a resume-specific message", async () => {
		const first = make({ mode: "interactive" });
		await first.run("chg-res-3", SCOPE, {});
		// biome-ignore lint/suspicious/noExplicitAny: share the saved artifacts
		const store = (first as any).artifactStore;
		const second = make({ mode: "auto", failOn: "analisis" });
		// biome-ignore lint/suspicious/noExplicitAny: seed the saved artifacts
		for (const a of (await store.loadAll("chg-res-3")).values())
			await (second as any).artifactStore.save("chg-res-3", a);
		const result = await second.resume("chg-res-3", SCOPE, {});
		expect(result.status).toBe("FAILED");
		expect(result.blockedAtFase).toBe("analisis");
		expect(result.message).toBe('Reanudación detenida en fase "analisis"');
		expect(result.reasons).toEqual(["LLM call failed: down:analisis"]);
	});

	it("re-runs a phase whose saved artifact is not SUCCESS", async () => {
		const o = make();
		// biome-ignore lint/suspicious/noExplicitAny: seed a failed artifact
		await (o as any).artifactStore.save("chg-res-5", {
			fase: "solicitud",
			status: "FAILED",
			input: {},
			output: null,
			gateResults: [],
			evidence: [],
			errors: ["earlier failure"],
			confidence: 0,
			ejecutadoEn: new Date().toISOString(),
			duracionMs: 0,
		});
		const result = await o.resume("chg-res-5", SCOPE, {});
		expect(result.status).toBe("COMPLETED");
		expect(result.phaseArtifacts?.get("solicitud")?.status).toBe("SUCCESS");
		// A re-run phase starts again from the initial input, not from the failed output.
		expect(result.phaseArtifacts?.get("solicitud")?.input).toEqual({
			changeId: "chg-res-5",
			scope: SCOPE,
			metadata: {},
		});
		expect([...(result.phaseArtifacts?.keys() ?? [])]).toEqual(FASES);
	});

	it("completes a partially saved pipeline in auto mode", async () => {
		const first = make({ mode: "interactive" });
		await first.run("chg-res-4", SCOPE, {});
		const second = make({ mode: "auto" });
		// biome-ignore lint/suspicious/noExplicitAny: seed the saved artifacts
		const store = (first as any).artifactStore;
		// biome-ignore lint/suspicious/noExplicitAny: seed the saved artifacts
		for (const a of (await store.loadAll("chg-res-4")).values())
			await (second as any).artifactStore.save("chg-res-4", a);
		const result = await second.resume("chg-res-4", SCOPE, {});
		expect(result.status).toBe("COMPLETED");
		expect(result.message).toBe("Pipeline reanudado y completado exitosamente");
		expect([...(result.phaseArtifacts?.keys() ?? [])]).toEqual(FASES);
	});
});

describe("extractSubsystems()", () => {
	// biome-ignore lint/suspicious/noExplicitAny: private method under test
	const extract = (out: Record<string, unknown>) =>
		(make() as any).extractSubsystems(out);

	it("prefers an explicit subsistemasAfectados array and stringifies items", () => {
		expect(
			extract({
				subsistemasAfectados: ["a", 2],
				tareasImplementadas: [{ subsistema: "z" }],
			}),
		).toEqual(["a", "2"]);
	});

	it("collects subsistema/afecta from tareasImplementadas without duplicates", () => {
		expect(
			extract({
				tareasImplementadas: [
					{ subsistema: "ventas", afecta: "igv" },
					{ subsistema: "ventas" },
					null,
					"texto",
					{},
				],
			}),
		).toEqual(["ventas", "igv"]);
	});

	it("returns [] when neither field is an array", () => {
		expect(extract({})).toEqual([]);
		expect(
			extract({ subsistemasAfectados: "x", tareasImplementadas: "y" }),
		).toEqual([]);
	});
});
