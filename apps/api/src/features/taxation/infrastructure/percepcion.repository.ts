import { type Currency, Money } from "@drenyra/domain/value-objects/Money";
import { db } from "@drenyra/persistence/client";
import { and, eq, not } from "@drenyra/persistence/query";
import { percepciones } from "@drenyra/persistence/schema";
import type { PercepcionStatus } from "../domain/entities/percepcion.entity";
import { Percepcion } from "../domain/entities/percepcion.entity";
import type { IPercepcionRepository } from "../domain/ports/percepcion-repository.port";

type PercepcionRow = typeof percepciones.$inferSelect;

function rowToEntity(row: PercepcionRow): Percepcion {
	const currency = (
		row.currency === "USD" || row.currency === "EUR" ? row.currency : "PEN"
	) as Currency;

	return Percepcion.reconstitute({
		id: row.id,
		companyId: row.companyId,
		billId: row.billId,
		agentRuc: row.agentRuc,
		percepcionType: row.percepcionType,
		totalAmount: Money.fromCents(row.totalAmountCents, currency),
		percepcionAmount: Money.fromCents(row.percepcionAmountCents, currency),
		status: row.status as PercepcionStatus,
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

function entityToRow(percepcion: Percepcion): typeof percepciones.$inferInsert {
	return {
		id: percepcion.id,
		companyId: percepcion.companyId,
		billId: percepcion.billId,
		agentRuc: percepcion.agentRuc,
		percepcionType: percepcion.percepcionType,
		totalAmountCents: percepcion.totalAmount.getCents(),
		percepcionAmountCents: percepcion.percepcionAmount.getCents(),
		currency: "PEN",
		status: percepcion.status,
		declarationPeriod: percepcion.declarationPeriod,
		sunatDueDate: formatDate(percepcion.sunatDueDate),
		pdtReference: percepcion.pdtReference ?? null,
		cancellationReason: percepcion.cancellationReason ?? null,
		createdAt: percepcion.createdAt,
		declaredAt: percepcion.declaredAt ?? null,
		paidAt: percepcion.paidAt ?? null,
		cancelledAt: percepcion.cancelledAt ?? null,
	};
}

export class PercepcionRepository implements IPercepcionRepository {
	async save(percepcion: Percepcion): Promise<void> {
		await db.insert(percepciones).values(entityToRow(percepcion));
	}

	async update(percepcion: Percepcion): Promise<void> {
		await db
			.update(percepciones)
			.set({
				status: percepcion.status,
				pdtReference: percepcion.pdtReference ?? null,
				cancellationReason: percepcion.cancellationReason ?? null,
				declaredAt: percepcion.declaredAt ?? null,
				paidAt: percepcion.paidAt ?? null,
				cancelledAt: percepcion.cancelledAt ?? null,
			})
			.where(eq(percepciones.id, percepcion.id));
	}

	async findById(id: string): Promise<Percepcion | null> {
		const row = await db.query.percepciones.findFirst({
			where: eq(percepciones.id, id),
		});
		return row ? rowToEntity(row) : null;
	}

	async findByBillId(billId: string): Promise<Percepcion | null> {
		const row = await db.query.percepciones.findFirst({
			where: and(
				eq(percepciones.billId, billId),
				not(eq(percepciones.status, "CANCELLED")),
			),
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		});
		return row ? rowToEntity(row) : null;
	}

	async findByStatus(
		companyId: string,
		status: PercepcionStatus,
	): Promise<Percepcion[]> {
		const rows = await db.query.percepciones.findMany({
			where: and(
				eq(percepciones.companyId, companyId),
				eq(percepciones.status, status),
			),
			orderBy: (t, { asc }) => [asc(t.sunatDueDate)],
		});
		return rows.map(rowToEntity);
	}

	async findByDeclarationPeriod(
		companyId: string,
		declarationPeriod: string,
	): Promise<Percepcion[]> {
		const rows = await db.query.percepciones.findMany({
			where: and(
				eq(percepciones.companyId, companyId),
				eq(percepciones.declarationPeriod, declarationPeriod),
			),
			orderBy: (t, { asc }) => [asc(t.createdAt)],
		});
		return rows.map(rowToEntity);
	}
}

export const percepcionRepository = new PercepcionRepository();

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}
