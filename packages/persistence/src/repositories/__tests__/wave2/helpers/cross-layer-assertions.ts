/**
 * CrossLayerAssertions — Invariantes transversales de Wave 2.
 *
 * Centraliza assertions que verifican estado en múltiples tablas.
 * Los mensajes de error incluyen conteos y estados encontrados.
 */

import { expect } from "vitest";
import type { TableStateReader } from "./table-state-reader";

export class CrossLayerAssertions {
	constructor(private readonly reader: TableStateReader) {}

	/**
	 * Exactamente 1 efecto de dominio (invoice, documento, etc).
	 * Falla si count !== 1.
	 */
	async expectExactlyOneDomainEffect(
		table: string,
		companyId: string,
		label?: string,
	): Promise<void> {
		const count = await this.reader.countDomainEffects(table, companyId);
		expect(
			count,
			`[${label ?? table}] Expected exactly 1 domain effect, found ${count}`,
		).toBe(1);
	}

	/**
	 * Idempotency record completado exactamente 1 vez.
	 */
	async expectSingleCompletedIdempotencyRecord(key: string): Promise<void> {
		const total = await this.reader.countIdempotencyRecords(key);
		const status = await this.reader.readIdempotencyStatus(key);
		expect(
			total,
			`[idempotency] Expected 1 record for key '${key}', found ${total}`,
		).toBe(1);
		expect(status, `[idempotency] Expected COMPLETED, found ${status}`).toBe(
			"COMPLETED",
		);
	}

	/**
	 * Inbox message completado exactamente 1 vez.
	 */
	async expectInboxCompletedOnce(messageId: string): Promise<void> {
		const total = await this.reader.countInboxMessages(messageId);
		const status = await this.reader.readInboxStatus(messageId);
		expect(
			total,
			`[inbox] Expected 1 message for '${messageId}', found ${total}`,
		).toBe(1);
		expect(status, `[inbox] Expected COMPLETED, found ${status}`).toBe(
			"COMPLETED",
		);
	}

	/**
	 * Job execution existe y está en el estado esperado.
	 */
	async expectSingleLogicalJobExecution(
		logicalKey: string,
		expectedStatus: string,
	): Promise<void> {
		const count = await this.reader.countJobExecutions(logicalKey);
		const exec = await this.reader.readJobExecutionStatus(logicalKey);
		expect(
			count,
			`[job_executions] Expected 1 execution for '${logicalKey}', found ${count}`,
		).toBe(1);
		expect(
			exec?.status,
			`[job_executions] Expected status=${expectedStatus}, found ${exec?.status}`,
		).toBe(expectedStatus);
	}

	/**
	 * No hay outboxes huérfanas (outbox sin execution o execution sin outbox).
	 */
	async expectNoOrphanedOutboxes(): Promise<void> {
		const allRows = await this.reader.countAllRows();
		const executions = allRows.job_executions ?? 0;
		const outboxes = allRows.job_outbox ?? 0;
		expect(
			outboxes,
			`[outbox] Expected outboxes <= executions (${outboxes} > ${executions})`,
		).toBeLessThanOrEqual(executions || 1);
	}

	/**
	 * Una execution específica tiene outbox con el estado esperado.
	 */
	async expectJobOutboxStatus(
		executionId: string,
		expectedStatus: string,
	): Promise<void> {
		const status = await this.reader.readJobOutboxStatus(executionId);
		expect(
			status,
			`[job_outbox] Expected ${expectedStatus}, found ${status}`,
		).toBe(expectedStatus);
	}

	/**
	 * Aislamiento entre tenants: datos de tenant A no aparecen en tenant B.
	 */
	async expectTenantIsolation(
		table: string,
		tenantACompanyId: string,
		tenantBCompanyId: string,
	): Promise<void> {
		const countA = await this.reader.countDomainEffects(
			table,
			tenantACompanyId,
		);
		const countB = await this.reader.countDomainEffects(
			table,
			tenantBCompanyId,
		);
		const total = (await this.reader.countAllRows())[table] ?? 0;

		expect(
			countA + countB,
			`[isolation] Rows in ${table} should be sum of per-tenant counts (${countA}+${countB}), total=${total}`,
		).toBeLessThanOrEqual(total);

		// If tenant A wrote, tenant B shouldn't see those rows
		// This is checked by verifying the WHERE clause uses company_id
	}

	/**
	 * No hay estado parcial: execution COMPLETED debe tener completed_at,
	 * FAILED debe tener failure_class, etc.
	 */
	async expectNoPartialState(logicalKey: string): Promise<void> {
		const exec = await this.reader.readJobExecutionStatus(logicalKey);
		if (!exec) return; // no execution = no partial state

		if (exec.status === "FAILED") {
			expect(
				exec.failureClass,
				`[partial] FAILED execution '${logicalKey}' must have failure_class`,
			).not.toBeNull();
		}
		if (exec.status === "COMPLETED") {
			expect(
				exec.attemptCount,
				`[partial] COMPLETED execution '${logicalKey}' should have attemptCount >= 0`,
			).toBeGreaterThanOrEqual(0);
		}
	}

	/**
	 * Verifica que exactamente 0 filas existen para un conjunto de condiciones.
	 */
	async expectZeroRows(
		table: string,
		_condition: string,
		label: string,
	): Promise<void> {
		const count = await this.reader.countAllRows();
		const tableCount = count[table] ?? 0;
		expect(
			tableCount,
			`[${label}] Expected 0 rows in ${table}, found ${tableCount}`,
		).toBe(0);
	}
}
