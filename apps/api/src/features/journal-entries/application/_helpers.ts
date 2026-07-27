/**
 * Internal helpers for the journal-entries CQRS layer.
 *
 * @module journal-entries/application
 */

import {
	PostgresAccountingPeriodRepository,
	PostgresJournalEntryRepository,
} from "@drenyra/persistence";
import { eq } from "drizzle-orm";
import { db, schema } from "../../../lib/db";

export const journalRepository = new PostgresJournalEntryRepository();

/**
 * Accounting period repository for period validation when mayorizando.
 */
export const periodRepository = new PostgresAccountingPeriodRepository();

/**
 * Resolve organizationId (numeric) from a company UUID.
 */
export async function resolveOrganizationId(
	companyId: string,
): Promise<number> {
	const row = await db
		.select({ id: schema.organizations.id })
		.from(schema.organizations)
		.innerJoin(
			schema.companies,
			eq(schema.companies.ruc, schema.organizations.ruc),
		)
		.where(eq(schema.companies.id, companyId))
		.limit(1);

	if (!row.length) {
		throw new Error(`No se encontró organización para company ${companyId}`);
	}
	return row[0].id;
}

/**
 * Inline AccountService for journal entry creation.
 * Queries the PCGE accounts table to resolve account codes/names.
 */
export const accountService = {
	async getById(id: string): Promise<{ code: string; name: string } | null> {
		const row = await db.query.pcgeAccounts.findFirst({
			where: eq(schema.pcgeAccounts.id, id),
		});
		if (!row) return null;
		return { code: row.code, name: row.name };
	},
};
