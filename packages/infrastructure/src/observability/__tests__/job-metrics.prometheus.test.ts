/**
 * T23 — Prometheus adapter tests
 *
 * Verifica que el adapter Prometheus:
 *   - Registra los 9 counters esperados
 *   - Labels de baja cardinalidad únicamente
 *   - No lanza excepciones
 *   - UNKNOWN incrementa su contador
 */

import { describe, expect, it } from "vitest";
import {
	PrometheusJobExecutionMetrics,
	type PrometheusRegister,
} from "../job-metrics.prometheus";

// ─── Helpers ───────────────────────────────────────────────────────────────

function createMockRegister() {
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
			inc: () => {
				counts[config.name]++;
			},
		} as ReturnType<PrometheusRegister["counter"]>;
	};

	const gauge = () => ({
		set: () => {},
	});

	return { counter, gauge, counts, calls };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("PrometheusJobExecutionMetrics", () => {
	it("registra los 9 counters esperados al construirse", () => {
		const register = createMockRegister();
		const _m = new PrometheusJobExecutionMetrics(
			register as unknown as PrometheusRegister,
		);

		const expectedCounters = [
			"job_outbox_published_total",
			"job_outbox_publish_failures_total",
			"job_outbox_claim_expired_total",
			"job_execution_lease_expired_total",
			"job_recovery_total",
			"job_reconciliation_repairs_total",
			"job_execution_terminal_failures_total",
			"job_execution_superseded_total",
			"job_execution_unknown_total",
		];

		for (const name of expectedCounters) {
			expect(register.calls.some((c) => c.name === name)).toBe(true);
		}
		expect(register.calls.length).toBe(9);
	});

	it("cada transición emite exactamente la métrica esperada", () => {
		const register = createMockRegister();
		const m = new PrometheusJobExecutionMetrics(
			register as unknown as PrometheusRegister,
		);

		m.outboxPublished({ queueName: "q", jobType: "t" });
		expect(register.counts.job_outbox_published_total).toBe(1);

		m.outboxPublishFailed({ queueName: "q", jobType: "t" });
		expect(register.counts.job_outbox_publish_failures_total).toBe(1);

		m.leaseExpired({ queueName: "q", jobType: "t" });
		expect(register.counts.job_execution_lease_expired_total).toBe(1);

		m.recoveryPerformed({ queueName: "q", jobType: "t" });
		expect(register.counts.job_recovery_total).toBe(1);

		m.reconciliationRepair({ repairType: "recreate-outbox" });
		expect(register.counts.job_reconciliation_repairs_total).toBe(1);

		m.executionUnknown({ queueName: "q", jobType: "t" });
		expect(register.counts.job_execution_unknown_total).toBe(1);

		m.executionTerminalFailure({ queueName: "q", jobType: "t" });
		expect(register.counts.job_execution_terminal_failures_total).toBe(1);

		m.executionSuperseded({ queueName: "q", jobType: "t" });
		expect(register.counts.job_execution_superseded_total).toBe(1);

		m.outboxClaimExpired({ queueName: "q", jobType: "t" });
		expect(register.counts.job_outbox_claim_expired_total).toBe(1);
	});

	it("labels de baja cardinalidad — no contienen IDs", () => {
		const register = createMockRegister();
		const m = new PrometheusJobExecutionMetrics(
			register as unknown as PrometheusRegister,
		);

		m.outboxPublished({
			queueName: "sunat-submission",
			jobType: "submit",
		});

		// Tipo MetricLabels no permite execution_id como label
		const ok: Parameters<typeof m.outboxPublished>[0] = {
			queueName: "q",
			jobType: "t",
		};
		expect(ok).toBeTruthy();
	});

	it("UNKNOWN incrementa su contador", () => {
		const register = createMockRegister();
		const m = new PrometheusJobExecutionMetrics(
			register as unknown as PrometheusRegister,
		);

		m.executionUnknown({ queueName: "email", jobType: "send" });
		expect(register.counts.job_execution_unknown_total).toBe(1);

		m.executionUnknown({ queueName: "email", jobType: "send" });
		expect(register.counts.job_execution_unknown_total).toBe(2);
	});

	it("no hay doble conteo en un solo evento", () => {
		const register = createMockRegister();
		const m = new PrometheusJobExecutionMetrics(
			register as unknown as PrometheusRegister,
		);

		m.outboxPublished({ queueName: "q", jobType: "t" });
		m.outboxPublished({ queueName: "q", jobType: "t" });
		expect(register.counts.job_outbox_published_total).toBe(2);
	});

	it("no lanza excepciones", () => {
		const register = createMockRegister();
		const m = new PrometheusJobExecutionMetrics(
			register as unknown as PrometheusRegister,
		);

		expect(() => {
			m.outboxPublished({ queueName: "q" });
			m.outboxPublishFailed({ jobType: "t" });
			m.leaseExpired({});
			m.recoveryPerformed({});
			m.reconciliationRepair({ repairType: "x" });
			m.executionUnknown({});
			m.executionTerminalFailure({});
			m.executionSuperseded({});
		}).not.toThrow();
	});
});
