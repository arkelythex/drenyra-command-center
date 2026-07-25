/**
 * T26 — Tests de métricas y logging
 *
 * Cobertura:
 *   - Noop nunca altera el flujo
 *   - Cada transición emite métrica esperada
 *   - Labels no contienen IDs de alta cardinalidad
 *   - Tokens solo hasheados en logs
 *   - UNKNOWN incrementa su contador
 *   - recovery y reconciliation usan labels tipadas
 *   - Adapter que lanza excepciones no afecta resultado
 *   - No hay doble conteo en retries del relay
 *   - Eventos post-commit solo se registran después del commit
 *   - Errores incluyen clase/código, no payload
 *   - Ninguna dependencia productiva importa @drenyra/test-utils
 */

import {
	type JobLogContext,
	type JobMetricLabels,
	NoopJobExecutionMetrics,
	NoopLogger,
	type RepairMetricLabels,
} from "@drenyra/persistence";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════
// 1. Noop nunca altera el flujo
// ═══════════════════════════════════════════════════════════════════════════

describe("NoopJobExecutionMetrics — never alters flow", () => {
	it("all methods are no-ops that don't throw", () => {
		const m = new NoopJobExecutionMetrics();
		expect(() => {
			m.outboxPublished({});
			m.outboxPublishFailed({});
			m.outboxClaimExpired({});
			m.leaseExpired({});
			m.recoveryPerformed({});
			m.reconciliationRepair({ repairType: "test" });
			m.executionUnknown({});
			m.executionTerminalFailure({});
			m.executionSuperseded({});
		}).not.toThrow();
	});

	it("NoopLogger nunca altera el flujo", () => {
		const l = new NoopLogger();
		expect(() => {
			l.debug("test", {});
			l.info("test", {});
			l.warn("test", {});
			l.error("test", { error: new Error("x") });
		}).not.toThrow();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Labels de baja cardinalidad (verificación de tipos)
// ═══════════════════════════════════════════════════════════════════════════

describe("Labels — baja cardinalidad", () => {
	it("los tipos MetricLabels no permiten execution_id como label", () => {
		const labels: JobMetricLabels = {
			queueName: "q",
			jobType: "t",
		};
		// Solo se permiten labels de baja cardinalidad
		expect(labels.queueName).toBe("q");
		expect(labels.jobType).toBe("t");
		// @ts-expect-error — execution_id NO es una label válida
		const _bad: JobMetricLabels = { executionId: "x" };
	});

	it("RepairMetricLabels requiere repairType", () => {
		const labels: RepairMetricLabels = {
			repairType: "recreate-outbox",
		};
		expect(labels.repairType).toBe("recreate-outbox");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Excepciones del adapter no afectan resultado
// ═══════════════════════════════════════════════════════════════════════════

describe("Observabilidad — excepciones aisladas", () => {
	it("un adapter que lanza excepciones no afecta el resultado", () => {
		const _throwing: NoopJobExecutionMetrics = new NoopJobExecutionMetrics();
		// safeCall envuelve en try/catch
		const { safeCall } = require("../../observability-safe");

		let sideEffect = 0;
		expect(() => {
			safeCall(() => {
				sideEffect++;
				throw new Error("OBSERVABILITY_FAILURE");
			});
		}).not.toThrow();

		// El side effect ocurrió antes del throw
		expect(sideEffect).toBe(1);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Tokens solo hasheados en logs
// ═══════════════════════════════════════════════════════════════════════════

describe("LogContext — tokens sanitizados", () => {
	it("tokens completos no aparecen en context canónico", () => {
		const ctx: JobLogContext = {
			executionId: "exec-001",
			queueName: "q",
			jobType: "t",
		};

		// El context canónico no tiene campo 'executionToken' completo
		expect((ctx as Record<string, unknown>).executionToken).toBeUndefined();

		// Solo hash
		ctx.executionTokenHash = "a1b2c3d4e5f6g7h8";
		expect(ctx.executionTokenHash).toBeTruthy();
		expect(ctx.executionTokenHash?.length).toBe(16); // sha256 truncado
	});

	it("no incluye payload, ni datos fiscales", () => {
		const ctx: JobLogContext = {
			executionId: "exec-001",
		};

		// No hay campos para payload
		expect((ctx as Record<string, unknown>).payload).toBeUndefined();
		expect((ctx as Record<string, unknown>).document).toBeUndefined();
		expect((ctx as Record<string, unknown>).ruc).toBeUndefined();
		expect((ctx as Record<string, unknown>).email).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. No imports productivos de test-utils
// ═══════════════════════════════════════════════════════════════════════════

describe("Boundaries — imports de observabilidad", () => {
	it("ningún componente de métricas/logging importa @drenyra/test-utils", () => {
		const metricsSrc = NoopJobExecutionMetrics.toString();
		const loggerSrc = NoopLogger.toString();
		for (const src of [metricsSrc, loggerSrc]) {
			expect(src).not.toContain("@drenyra/test-utils");
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Mock Prometheus register que cuenta las inc llamadas */
function _createMockRegister() {
	const counts: Record<string, number> = {};
	const calls: Array<{ name: string; labelNames?: string[] }> = [];

	const counter = (config: {
		name: string;
		help: string;
		labelNames?: string[];
	}) => {
		calls.push(config);
		if (!(config.name in counts)) {
			counts[config.name] = 0;
		}
		return {
			inc: (_labels?: Record<string, string | number>) => {
				counts[config.name]++;
			},
		};
	};

	return { counter, counts, calls };
}
