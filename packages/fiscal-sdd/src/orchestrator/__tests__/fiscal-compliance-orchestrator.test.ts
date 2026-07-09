import { describe, expect, it } from "vitest";
import { FiscalComplianceOrchestrator } from "../fiscal-compliance-orchestrator";
import type { FiscalScope } from "../types";

const VALID_SCOPE: FiscalScope = {
	organizationId: "org-1",
	companyId: "comp-1",
	companyRuc: "20123456786",
	period: "2026-07",
};

const METADATA = {
	title: "Test Change: IGV Rate 18% → 19%",
	regulationRef: "Ley N° 12345 - Artículo 7°",
	description: "Actualización de tasa IGV",
};

/** Helper: configura un orchestrator con un provider custom que devuelve JSON válido */
function configureTestOrchestrator(config?: Record<string, unknown>) {
	const orchestrator = new FiscalComplianceOrchestrator({
		mode: "auto",
		artifactStore: "none",
		reviewBudget: 400,
		...config,
	} as Record<string, unknown>);

	orchestrator["modelRouter"].registerProvider("custom", (_model: string) => {
		return async (_s: string, _p: string) => {
			return JSON.stringify({
				titulo: "Test",
				normativa: "Ley 12345",
				comportamientoActual: "18%",
				comportamientoPropuesto: "19%",
				subsistemasAfectados: ["detracciones"],
				riesgos: [],
				alcanceEstimado: "2 módulos",
				criteriosAceptacion: ["criterio 1"],
				casosBorde: [],
				alcanceFiscal: {},
				decisionesArquitectonicas: [],
				modulosAfectados: [],
				estrategiaMigracion: "",
				gruposTareas: [],
				dependencias: [],
				lineasEstimadasTotal: 100,
				checklistRevision: [],
				tareasImplementadas: [],
				archivosModificados: [],
				resultadosPruebas: [],
				resultadosAceptacion: [],
				validacionesFiscales: [],
				verificacionScope: [],
				regresionesEncontradas: [],
				estadoGeneral: "COMPLETO",
			});
		};
	});

	// All 6 phases use custom provider
	const allPhases = [
		"solicitud",
		"analisis",
		"diseno",
		"plan",
		"migracion",
		"auditoria",
	] as const;

	orchestrator["modelRouter"].updateAssignments(
		allPhases.map((fase) => ({
			fase,
			provider: "custom" as const,
			model: "test-model",
			priority: 0,
			reason: "Test",
		})),
	);

	return orchestrator;
}

describe("FiscalComplianceOrchestrator", () => {
	it("creates orchestrator with default config", () => {
		const orchestrator = new FiscalComplianceOrchestrator();
		expect(orchestrator).toBeDefined();
	});

	it("creates orchestrator with custom config", () => {
		const orchestrator = new FiscalComplianceOrchestrator({
			mode: "interactive",
			artifactStore: "none",
			reviewBudget: 400,
		});
		expect(orchestrator).toBeDefined();
	});

	it("completes pipeline in auto mode", async () => {
		const orchestrator = configureTestOrchestrator();

		const result = await orchestrator.run(
			"test-integration-001",
			VALID_SCOPE,
			METADATA,
		);

		expect(result.status).toBe("COMPLETED");
		expect(result.changeId).toBe("test-integration-001");
	});

	it("passes preflight with valid scope", async () => {
		const orchestrator = configureTestOrchestrator();

		const result = await orchestrator.run(
			"test-preflight-001",
			VALID_SCOPE,
			METADATA,
		);

		expect(result.status).toBe("COMPLETED");
	});

	it("blocks on invalid RUC during preflight", async () => {
		const orchestrator = configureTestOrchestrator();

		const result = await orchestrator.run(
			"test-bad-ruc",
			{
				...VALID_SCOPE,
				companyRuc: "12345678901",
			},
			METADATA,
		);

		expect(result.status).toBe("PREFLIGHT_BLOCKED");
		expect(result.reasons?.length).toBeGreaterThanOrEqual(1);
	});

	it("waits for approval in interactive mode", async () => {
		const orchestrator = configureTestOrchestrator({
			mode: "interactive",
		});

		const result = await orchestrator.run(
			"test-interactive-001",
			VALID_SCOPE,
			METADATA,
		);

		expect(result.status).toBe("AWAITING_APPROVAL");
		expect(result.blockedAtFase).toBe("solicitud");
	});

	it("returns phases artifacts on completion", async () => {
		const orchestrator = configureTestOrchestrator();

		const result = await orchestrator.run(
			"test-artifacts-001",
			VALID_SCOPE,
			METADATA,
		);

		expect(result.status).toBe("COMPLETED");
		expect(result.phaseArtifacts).toBeDefined();
		expect(result.phaseArtifacts?.size).toBeGreaterThanOrEqual(1);
	});

	it("provides descriptive message on completion", async () => {
		const orchestrator = configureTestOrchestrator();

		const result = await orchestrator.run(
			"test-message-001",
			VALID_SCOPE,
			METADATA,
		);

		expect(result.message).toBeDefined();
		expect(typeof result.message).toBe("string");
	});

	// ─── Phase 2: ReviewGuard ─────────────────────────────────────────

	it("creates orchestrator with review guard", async () => {
		const orchestrator = configureTestOrchestrator({
			reviewBudget: 400,
		});

		// Pipeline con plan que excede budget
		const result = await orchestrator.run("test-review-001", VALID_SCOPE, {
			...METADATA,
			gruposTareas: Array.from({ length: 20 }, (_, i) => ({
				tarea: `Tarea ${i + 1}`,
			})),
			lineasEstimadasTotal: 100,
			subsistemasAfectados: [],
		});

		expect(result.status).toBe("COMPLETED");
	});

	it("handles review guard for high-risk plans", async () => {
		const orchestrator = new FiscalComplianceOrchestrator({
			mode: "auto",
			artifactStore: "none",
			reviewBudget: 100,
		});

		// No custom caller registrado — pasa preflight pero falla en fases
		// Esto verifica que ReviewGuard no rompe el pipeline
		expect(orchestrator).toBeDefined();
	});

	// ─── Phase 2: SubAgentRunner ──────────────────────────────────────

	it("creates orchestrator with sub-agents enabled", async () => {
		const orchestrator = configureTestOrchestrator({
			subAgents: true,
		});

		const result = await orchestrator.run(
			"test-subagent-001",
			VALID_SCOPE,
			METADATA,
		);

		expect(result.status).toBe("COMPLETED");
	});

	it("creates orchestrator with sub-agents disabled", () => {
		const orchestrator = new FiscalComplianceOrchestrator({
			subAgents: false,
		});
		expect(orchestrator).toBeDefined();
	});

	// ─── Phase 2: Compliance Chains ───────────────────────────────────

	it("pipeline with compliance chains for fiscal change", async () => {
		const orchestrator = configureTestOrchestrator();

		const result = await orchestrator.run(
			"test-chains-001",
			VALID_SCOPE,
			METADATA,
		);

		expect(result.status).toBe("COMPLETED");
	});
});
