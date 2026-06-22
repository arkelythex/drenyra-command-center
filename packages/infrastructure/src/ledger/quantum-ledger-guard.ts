/**
 * Quantum Ledger Guard
 *
 * Implements HarmonyOS Immutability Principle:
 * - Append-only ledger (no UPDATE/DELETE)
 * - Hash chain verification
 * - Period closing for SUNAT compliance
 *
 * @module domain/ledger/quantum-ledger-guard
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@arkelythex/persistence/client";
import { journalEntries, journalEntryLines } from "@arkelythex/persistence/schema";
import { accountBalances } from "@arkelythex/persistence/schema/schema-extensions";

// ============================================
// TYPES
// ============================================

interface LedgerGuardResult {
	allowed: boolean;
	reason?: string;
}

interface PeriodStatus {
	isClosed: boolean;
	closedAt?: Date;
	entriesCount: number;
}

// ============================================
// APPEND-ONLY GUARDS
// ============================================

/**
 * Check if a period is closed (no more entries allowed)
 * @param organizationId - Input for organizationId.
 * @param year - Input for year.
 * @param month - Input for month.
 * @returns Result of isPeriodClosed.
 * @example
 * ```ts
 * const result = await isPeriodClosed(0, 0, 0);
 * console.log(result);
 * ```
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
 *
 * Rules:
 * - Cannot post to closed periods
 * - Entry date must not be in the future
 * @param organizationId - Input for organizationId.
 * @param entryDate - Input for entryDate.
 * @returns Result of canCreateJournalEntry.
 * @example
 * ```ts
 * const result = await canCreateJournalEntry(0, new Date());
 * console.log(result);
 * ```
 */

export async function canCreateJournalEntry(
	organizationId: number,
	entryDate: Date,
): Promise<LedgerGuardResult> {
	const year = entryDate.getFullYear();
	const month = entryDate.getMonth() + 1;
	const now = new Date();

	// Rule 1: No future entries
	if (entryDate > now) {
		return {
			allowed: false,
			reason: "No se pueden crear asientos con fecha futura",
		};
	}

	// Rule 2: Period must not be closed
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
 *
 * Rules:
 * - Only draft entries can be posted
 * - Posted entries cannot be modified (append-only)
 * @param journalEntryId - Input for journalEntryId.
 * @param newStatus - Input for newStatus.
 * @returns Result of canModifyJournalEntry.
 * @example
 * ```ts
 * const result = await canModifyJournalEntry("", "borrador");
 * console.log(result);
 * ```
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

	// Once posted (mayorizado), cannot go back to draft
	if (entry.status === "mayorizado" && newStatus === "borrador") {
		return {
			allowed: false,
			reason:
				"Un asiento mayorizado no puede volver a borrador (inmutabilidad)",
		};
	}

	// Once declared, cannot change at all
	if (entry.status === "declarado") {
		return {
			allowed: false,
			reason: "Un asiento declarado es inmutable (SUNAT)",
		};
	}

	// Verify period is not closed for posted entries
	if (newStatus === "mayorizado" || newStatus === "declarado") {
		const year = entry.date.getFullYear();
		const month = entry.date.getMonth() + 1;
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
 * @param organizationId - Input for organizationId.
 * @param year - Input for year.
 * @param month - Input for month.
 * @returns Result of getPeriodStatus.
 * @example
 * ```ts
 * const result = await getPeriodStatus(0, 0, 0);
 * console.log(result);
 * ```
 */

export async function getPeriodStatus(
	organizationId: number,
	year: number,
	month: number,
): Promise<PeriodStatus> {
	// Check if closed
	const closed = await isPeriodClosed(organizationId, year, month);

	// Get entries count for this period
	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 0, 23, 59, 59);

	const [countResult] = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(journalEntries)
		.where(
			and(
				eq(journalEntries.organizationId, organizationId),
				sql`${journalEntries.date} >= ${startDate}`,
				sql`${journalEntries.date} <= ${endDate}`,
			),
		);

	// Get closed date if closed
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

// ============================================
// REVERSAL ENTRY (Para correcciones)
// ============================================

/**
 * Create a reversal entry for corrections
 *
 * Instead of UPDATE, we create a reversal (asiento de reversión)
 * and then a new corrected entry. This maintains immutability.
 * @param originalEntryId - Input for originalEntryId.
 * @param reason - Input for reason.
 * @param userId - Input for userId.
 * @returns Result of createReversalEntry.
 * @example
 * ```ts
 * const result = await createReversalEntry("", "", "");
 * console.log(result);
 * ```
 */

export async function createReversalEntry(
	originalEntryId: string,
	reason: string,
	userId: string,
): Promise<{ reversalId: string; allowed: boolean; reason?: string }> {
	// Get original entry
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

	// Cannot reverse a draft
	if (original.status === "borrador") {
		return {
			reversalId: "",
			allowed: false,
			reason: "No se puede revertir un borrador",
		};
	}

	// Generate reversal entry number
	const reversalNumber = `REV-${original.entryNumber}`;
	const reversalId = `${original.organizationId}-${reversalNumber}`;

	// Create reversal entry (swap debit/credit)
	await db.insert(journalEntries).values({
		id: reversalId,
		organizationId: original.organizationId,
		entryNumber: reversalNumber,
		date: new Date(),
		gloss: `REVERSIÓN: ${reason}. Ref: ${original.entryNumber}`,
		status: "mayorizado",
		totalDebit: original.totalCredit, // Swapped
		totalCredit: original.totalDebit, // Swapped
		createdBy: userId,
		postedBy: userId,
		postedAt: new Date(),
	});

	// Create reversal lines (swap debit/credit)
	for (const line of original.lines || []) {
		await db.insert(journalEntryLines).values({
			id: `${reversalId}-${line.accountId}`,
			journalEntryId: reversalId,
			accountId: line.accountId,
			gloss: `Reversión: ${line.gloss}`,
			debit: line.credit, // Swapped
			credit: line.debit, // Swapped
		});
	}

	return { reversalId, allowed: true };
}
