/**
 * RetencionRepository — Drizzle/PostgreSQL adapter for Retencion persistence.
 *
 * Implements IRetencionRepository. Handles Money VO ↔ cents mapping
 * and domain entity reconstitution via Retencion.reconstitute().
 *
 * @module taxation/infrastructure
 *
 * @example
 * ```ts
 * const repo = new RetencionRepository();
 * await repo.save(retencion);
 * const r = await repo.findById('ret_1');
 * ```
 */

import { type Currency, Money } from "@arkelythex/domain/value-objects/Money";
import { db } from "@arkelythex/persistence/client";
import { and, eq, not } from "@arkelythex/persistence/query";
import { retenciones } from "@arkelythex/persistence/schema";
import type { RetentionStatus } from "../domain/entities/retencion.entity";
import { Retencion } from "../domain/entities/retencion.entity";
import type { IRetencionRepository } from "../domain/ports/retencion-repository.port";

type RetencionRow = typeof retenciones.$inferSelect;

/**
 * Maps a Drizzle row to a Retencion domain entity.
 */
function rowToEntity(row: RetencionRow): Retencion {
	const currency = (
		row.currency === "USD" || row.currency === "EUR" ? row.currency : "PEN"
	) as Currency;

	return Retencion.reconstitute({
		id: row.id,
		companyId: row.companyId,
		billId: row.billId,
		supplierRuc: row.supplierRuc,
		baseAmount: Money.fromCents(row.baseAmountCents, currency),
		retentionAmount: Money.fromCents(row.retentionAmountCents, currency),
		status: row.status as RetentionStatus,
		declarationPeriod: row.declarationPeriod,
		sunatDueDate: new Date(row.sunatDueDate),
		pdtReference: row.pdtReference ?? undefined,
		cancellationReason: row.cancellationReason ?? undefined,
		createdAt: row.createdAt,
		declaredAt: row.declaredAt ?? undefined,
		paidAt: row.paidAt ?? undefined,
		cancelledAt: row.cancelledAt ?? undefined,
	});
}

/**
 * Maps a Retencion domain entity to a Drizzle insert/update shape.
 */
function entityToRow(retencion: Retencion): typeof retenciones.$inferInsert {
	return {
		id: retencion.id,
		companyId: retencion.companyId,
		billId: retencion.billId,
		supplierRuc: retencion.supplierRuc,
		baseAmountCents: retencion.baseAmount.getCents(),
		retentionAmountCents: retencion.retentionAmount.getCents(),
		currency: "PEN",
		status: retencion.status,
		declarationPeriod: retencion.declarationPeriod,
		sunatDueDate: formatDate(retencion.sunatDueDate),
		pdtReference: retencion.pdtReference ?? null,
		cancellationReason: retencion.cancellationReason ?? null,
		createdAt: retencion.createdAt,
		declaredAt: retencion.declaredAt ?? null,
		paidAt: retencion.paidAt ?? null,
		cancelledAt: retencion.cancelledAt ?? null,
	};
}

/**
 * Drizzle ORM adapter for Retencion.
 *
 * @example
 * ```ts
 * const repo = new RetencionRepository();
 * await repo.save(retencion);
 * ```
 */
export class RetencionRepository implements IRetencionRepository {
	/**
	 * INSERT a new Retencion row.
	 *
	 * @example
	 * ```ts
	 * await repo.save(retencion);
	 * ```
	 */
	async save(retencion: Retencion): Promise<void> {
		await db.insert(retenciones).values(entityToRow(retencion));
	}

	/**
	 * UPDATE an existing Retencion row (status transitions).
	 *
	 * @example
	 * ```ts
	 * await repo.update(declaredRetencion);
	 * ```
	 */
	async update(retencion: Retencion): Promise<void> {
		await db
			.update(retenciones)
			.set({
				status: retencion.status,
				pdtReference: retencion.pdtReference ?? null,
				cancellationReason: retencion.cancellationReason ?? null,
				declaredAt: retencion.declaredAt ?? null,
				paidAt: retencion.paidAt ?? null,
				cancelledAt: retencion.cancelledAt ?? null,
			})
			.where(eq(retenciones.id, retencion.id));
	}

	/**
	 * Find by UUID. Returns null when not found.
	 *
	 * @example
	 * ```ts
	 * const r = await repo.findById('ret_1');
	 * ```
	 */
	async findById(id: string): Promise<Retencion | null> {
		const row = await db.query.retenciones.findFirst({
			where: eq(retenciones.id, id),
		});
		return row ? rowToEntity(row) : null;
	}

	/**
	 * Find the active (non-cancelled) retention for a bill.
	 * Returns null if no retention exists or was cancelled.
	 *
	 * @example
	 * ```ts
	 * const r = await repo.findByBillId('bill_1');
	 * ```
	 */
	async findByBillId(billId: string): Promise<Retencion | null> {
		const row = await db.query.retenciones.findFirst({
			where: and(
				eq(retenciones.billId, billId),
				not(eq(retenciones.status, "CANCELLED")),
			),
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		});
		return row ? rowToEntity(row) : null;
	}

	/**
	 * List retentions for a company filtered by status.
	 *
	 * @example
	 * ```ts
	 * const pending = await repo.findByStatus('cmp_1', 'PENDING');
	 * ```
	 */
	async findByStatus(
		companyId: string,
		status: RetentionStatus,
	): Promise<Retencion[]> {
		const rows = await db.query.retenciones.findMany({
			where: and(
				eq(retenciones.companyId, companyId),
				eq(retenciones.status, status),
			),
			orderBy: (t, { asc }) => [asc(t.sunatDueDate)],
		});
		return rows.map(rowToEntity);
	}

	/**
	 * List retentions for a company and declaration period (PDT 626 grouping).
	 *
	 * @example
	 * ```ts
	 * const march = await repo.findByDeclarationPeriod('cmp_1', '2026-03');
	 * ```
	 */
	async findByDeclarationPeriod(
		companyId: string,
		declarationPeriod: string,
	): Promise<Retencion[]> {
		const rows = await db.query.retenciones.findMany({
			where: and(
				eq(retenciones.companyId, companyId),
				eq(retenciones.declarationPeriod, declarationPeriod),
			),
			orderBy: (t, { asc }) => [asc(t.createdAt)],
		});
		return rows.map(rowToEntity);
	}
}

/**
 * Default singleton instance.
 *
 * @example
 * ```ts
 * const r = await retencionRepository.findById('ret_1');
 * ```
 */
export const retencionRepository = new RetencionRepository();

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}
