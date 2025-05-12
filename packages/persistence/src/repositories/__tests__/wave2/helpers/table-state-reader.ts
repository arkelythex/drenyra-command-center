/**
 * TableStateReader — Lee estado persistido directamente desde PostgreSQL.
 *
 * No depende de los repositorios bajo prueba.
 * Usa queries SQL directas para verificar invariantes.
 */

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// ─── Tipos de respuesta ────────────────────────────────────────────────────

export interface IdempotencyRecordSnapshot {
	key: string;
	status: string;
	processingToken: string | null;
	createdAt: Date;
}

export interface InboxMessageSnapshot {
	id: string;
	messageId: string;
	status: string;
	processingToken: string | null;
	completedAt: Date | null;
}

export interface JobExecutionSnapshot {
	id: string;
	status: string;
	generation: number;
	attemptCount: number;
	executionToken: string | null;
	failureClass: string | null;
	failureCode: string | null;
	unknownReason: string | null;
	completedAt: Date | null;
	resolvedAt: Date | null;
}

export interface JobOutboxSnapshot {
	id: string;
	jobExecutionId: string;
	status: string;
	publishedAt: Date | null;
}

export interface InvoiceSnapshot {
	id: string;
	companyId: string;
	customerId: string;
	invoiceNumber: string;
	amount: number;
}

export interface Wave2FullSnapshot {
	tenantId: string;
	invoices: InvoiceSnapshot[];
	idempotencyRecords: IdempotencyRecordSnapshot[];
	inboxMessages: InboxMessageSnapshot[];
	jobExecutions: JobExecutionSnapshot[];
	jobOutboxes: JobOutboxSnapshot[];
	timestamp: Date;
}

// ─── Reader ─────────────────────────────────────────────────────────────────

export class TableStateReader {
	constructor(private readonly db: PostgresJsDatabase) {}

	async countInvoices(
		companyId?: string,
		invoiceNumber?: string,
	): Promise<number> {
		const conditions = [];
		if (companyId) conditions.push(sql`company_id = ${companyId}::uuid`);
		if (invoiceNumber) conditions.push(sql`invoice_number = ${invoiceNumber}`);
		const where =
			conditions.length > 0
				? sql`WHERE ${sql.join(conditions, sql` AND `)}`
				: sql``;
		const [row] = await this.db.execute(sql`
			SELECT count(*)::int as cnt FROM invoices ${where}
		`);
		return ((row as Record<string, unknown>)?.cnt as number) ?? 0;
	}

	async countIdempotencyRecords(idempotencyKey?: string): Promise<number> {
		const where = idempotencyKey
			? sql`WHERE idempotency_key = ${idempotencyKey}`
			: sql``;
		const [row] = await this.db.execute(sql`
			SELECT count(*)::int as cnt FROM idempotency_records ${where}
		`);
		return ((row as Record<string, unknown>)?.cnt as number) ?? 0;
	}

	async readIdempotencyStatus(idempotencyKey: string): Promise<string | null> {
		const [row] = await this.db.execute(sql`
			SELECT status FROM idempotency_records
			WHERE idempotency_key = ${idempotencyKey}
		`);
		const r = row as Record<string, unknown> | undefined;
		return (r?.status as string) ?? null;
	}

	async countInboxMessages(messageId?: string): Promise<number> {
		const where = messageId ? sql`WHERE message_id = ${messageId}` : sql``;
		const [row] = await this.db.execute(sql`
			SELECT count(*)::int as cnt FROM inbox_messages ${where}
		`);
		return ((row as Record<string, unknown>)?.cnt as number) ?? 0;
	}

	async readInboxStatus(messageId: string): Promise<string | null> {
		const [row] = await this.db.execute(sql`
			SELECT status FROM inbox_messages WHERE message_id = ${messageId}
		`);
		const r = row as Record<string, unknown> | undefined;
		return (r?.status as string) ?? null;
	}

	async countJobExecutions(logicalKey?: string): Promise<number> {
		const where = logicalKey ? sql`WHERE logical_key = ${logicalKey}` : sql``;
		const [row] = await this.db.execute(sql`
			SELECT count(*)::int as cnt FROM job_executions ${where}
		`);
		return ((row as Record<string, unknown>)?.cnt as number) ?? 0;
	}

	async readJobExecutionStatus(logicalKey: string): Promise<{
		status: string;
		generation: number;
		attemptCount: number;
		failureClass: string | null;
	} | null> {
		const [row] = await this.db.execute(sql`
			SELECT status, generation, attempt_count, failure_class
			FROM job_executions
			WHERE logical_key = ${logicalKey}
			ORDER BY created_at DESC
			LIMIT 1
		`);
		const r = row as Record<string, unknown> | undefined;
		if (!r) return null;
		return {
			status: r.status as string,
			generation: Number(r.generation),
			attemptCount: Number(r.attempt_count),
			failureClass: r.failure_class as string | null,
		};
	}

	async countJobOutboxes(executionId?: string): Promise<number> {
		const where = executionId
			? sql`WHERE job_execution_id = ${executionId}::uuid`
			: sql``;
		const [row] = await this.db.execute(sql`
			SELECT count(*)::int as cnt FROM job_outbox ${where}
		`);
		return ((row as Record<string, unknown>)?.cnt as number) ?? 0;
	}

	async readJobOutboxStatus(executionId: string): Promise<string | null> {
		const [row] = await this.db.execute(sql`
			SELECT status FROM job_outbox
			WHERE job_execution_id = ${executionId}::uuid
			ORDER BY created_at DESC
			LIMIT 1
		`);
		const r = row as Record<string, unknown> | undefined;
		return (r?.status as string) ?? null;
	}

	async countDomainEffects(table: string, companyId: string): Promise<number> {
		const [row] = await this.db.execute(sql`
			SELECT count(*)::int as cnt FROM ${sql.raw(table)}
			WHERE company_id = ${companyId}::uuid
		`);
		return ((row as Record<string, unknown>)?.cnt as number) ?? 0;
	}

	async snapshotWave2State(
		tenantId: string,
		testRunId: string,
	): Promise<Wave2FullSnapshot> {
		return {
			tenantId,
			invoices: await this.queryAll<InvoiceSnapshot>(
				"invoices",
				`company_id = '${tenantId}'::uuid`,
			),
			idempotencyRecords: [],
			inboxMessages: [],
			jobExecutions: await this.queryAll<JobExecutionSnapshot>(
				"job_executions",
				`logical_key LIKE '%${testRunId}%'`,
			),
			jobOutboxes: [],
			timestamp: new Date(),
		};
	}

	private async queryAll<T>(table: string, where: string): Promise<T[]> {
		const rows = await this.db.execute(sql`
			SELECT * FROM ${sql.raw(table)}
			WHERE ${sql.raw(where)}
		`);
		return rows as unknown as T[];
	}

	async countAllRows(): Promise<Record<string, number>> {
		const tables = [
			"invoices",
			"idempotency_records",
			"inbox_messages",
			"job_executions",
			"job_outbox",
		];
		const result: Record<string, number> = {};
		for (const table of tables) {
			try {
				const [row] = await this.db.execute(sql`
					SELECT count(*)::int as cnt FROM ${sql.raw(table)}
				`);
				result[table] = ((row as Record<string, unknown>)?.cnt as number) ?? 0;
			} catch {
				result[table] = -1; // table doesn't exist
			}
		}
		return result;
	}
}
