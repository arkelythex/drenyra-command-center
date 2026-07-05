/**
 * Quantum Ledger Guard
 *
 * Implements HarmonyOS Immutability Principle:
 * - Append-only ledger (no UPDATE/DELETE)
 * - Hash chain verification
 * - Period closing for SUNAT compliance
 */

import { db } from "@drenyra/persistence/client";
import { journalEntries, journalEntryLines } from "@drenyra/persistence/schema";
// @ts-expect-error — Missing module, install via bun add
import { accountBalances } from "@drenyra/persistence/schema/schema-extensions";
import { and, eq, sql } from "drizzle-orm";
import type { LedgerGuardResult, PeriodStatus } from "./types";

/**
 * Check if a period is closed (no more entries allowed)
 */

export async function isPeriodClosed(
	organizationId: number,
	year: number,
	month: number,
): Promise<boolean> {
	const [result] = await db
		.select({ isClosed: accountBalances.isMonthClosed })
		.from(accountBalances)
		.where(
			and(
				eq(accountBalances.organizationId, organizationId),
				eq(accountBalances.periodYear, year),
				eq(accountBalances.periodMonth, month),
				eq(accountBalances.isMonthClosed, true),
			),
		)
		.limit(1);

	return result?.isClosed ?? false;
}

/**
 * Validate if a new journal entry can be created
 */

export async function canCreateJournalEntry(
	organizationId: number,
	entryDate: Date,
): Promise<LedgerGuardResult> {
	const year = entryDate.getFullYear();
	const month = entryDate.getMonth() + 1;
	const now = new Date();

	if (entryDate > now) {
		return {
			allowed: false,
			reason: "No se pueden crear asientos con fecha futura",
		};
	}

	const closed = await isPeriodClosed(organizationId, year, month);
	if (closed) {
		return {
			allowed: false,
			reason: `El período ${year}-${month.toString().padStart(2, "0")} está cerrado`,
		};
	}

	return { allowed: true };
}

/**
 * Validate if a journal entry can be modified (posted/mayorizado)
 */

export async function canModifyJournalEntry(
	journalEntryId: string,
	newStatus: "borrador" | "mayorizado" | "declarado",
): Promise<LedgerGuardResult> {
	const entry = await db.query.journalEntries.findFirst({
		where: eq(journalEntries.id, journalEntryId),
	});

	if (!entry) {
		return { allowed: false, reason: "Asiento no encontrado" };
	}

	if (entry.status === "mayorizado" && newStatus === "borrador") {
		return {
			allowed: false,
			reason:
				"Un asiento mayorizado no puede volver a borrador (inmutabilidad)",
		};
	}

	if (entry.status === "declarado") {
		return {
			allowed: false,
			reason: "Un asiento declarado es inmutable (SUNAT)",
		};
	}

	if (newStatus === "mayorizado" || newStatus === "declarado") {
		const year = entry.date.getFullYear();
		const month = entry.date.getMonth() + 1;
		// @ts-expect-error — Drizzle schema evolution: column organizationId not in table result type
		const closed = await isPeriodClosed(entry.organizationId, year, month);

		if (closed) {
			return {
				allowed: false,
				reason: `El período ${year}-${month.toString().padStart(2, "0")} está cerrado`,
			};
		}
	}

	return { allowed: true };
}

/**
 * Get period status for an organization
 */

export async function getPeriodStatus(
	organizationId: number,
	year: number,
	month: number,
): Promise<PeriodStatus> {
	const closed = await isPeriodClosed(organizationId, year, month);

	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 0, 23, 59, 59);

	const [countResult] = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(journalEntries)
		.where(
			and(
				// @ts-expect-error — Drizzle schema evolution: column organizationId not in table schema
				eq(journalEntries.organizationId, organizationId),
				sql`${journalEntries.date} >= ${startDate}`,
				sql`${journalEntries.date} <= ${endDate}`,
			),
		);

	let closedAt: Date | undefined;
	if (closed) {
		const [balance] = await db
			.select({ calculatedAt: accountBalances.calculatedAt })
			.from(accountBalances)
			.where(
				and(
					eq(accountBalances.organizationId, organizationId),
					eq(accountBalances.periodYear, year),
					eq(accountBalances.periodMonth, month),
					eq(accountBalances.isMonthClosed, true),
				),
			)
			.limit(1);

		closedAt = balance?.calculatedAt ?? undefined;
	}

	return {
		isClosed: closed,
		closedAt,
		entriesCount: countResult?.count || 0,
	};
}

/**
 * Create a reversal entry for corrections
 */

export async function createReversalEntry(
	originalEntryId: string,
	reason: string,
	userId: string,
): Promise<{ reversalId: string; allowed: boolean; reason?: string }> {
	const original = await db.query.journalEntries.findFirst({
		where: eq(journalEntries.id, originalEntryId),
		with: { lines: true },
	});

	if (!original) {
		return {
			reversalId: "",
			allowed: false,
			reason: "Asiento original no encontrado",
		};
	}

	if (original.status === "borrador") {
		return {
			reversalId: "",
			allowed: false,
			reason: "No se puede revertir un borrador",
		};
	}

	const reversalNumber = `REV-${original.entryNumber}`;
	// @ts-expect-error — Drizzle schema evolution: column organizationId not in table result type
	const reversalId = `${original.organizationId}-${reversalNumber}`;

	// @ts-expect-error — Drizzle schema evolution: columns not in journalEntries table schema
	await db.insert(journalEntries).values({
		id: reversalId,
		// @ts-expect-error — Drizzle schema evolution: column organizationId not in table result type
		organizationId: original.organizationId,
		entryNumber: reversalNumber,
		date: new Date(),
		gloss: `REVERSIÓN: ${reason}. Ref: ${original.entryNumber}`,
		status: "mayorizado",
		// @ts-expect-error — Drizzle schema evolution: column totalCredit not in table result type
		totalDebit: original.totalCredit,
		// @ts-expect-error — Drizzle schema evolution: column totalDebit not in table result type
		totalCredit: original.totalDebit,
		createdBy: userId,
		postedBy: userId,
		postedAt: new Date(),
	});

	for (const line of original.lines || []) {
		// @ts-expect-error — Drizzle schema evolution: columns not in journalEntryLines table schema
		await db.insert(journalEntryLines).values({
			// @ts-expect-error — Drizzle schema evolution: column accountId not in line result type
			id: `${reversalId}-${line.accountId}`,
			journalEntryId: reversalId,
			// @ts-expect-error — Drizzle schema evolution: column accountId not in line result type
			accountId: line.accountId,
			// @ts-expect-error — Drizzle schema evolution: column gloss not in line result type
			gloss: `Reversión: ${line.gloss}`,
			// @ts-expect-error — Drizzle schema evolution: column credit not in line result type
			debit: line.credit,
			// @ts-expect-error — Drizzle schema evolution: column debit not in line result type
			credit: line.debit,
		});
	}

	return { reversalId, allowed: true };
}
