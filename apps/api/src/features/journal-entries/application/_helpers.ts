/**
 * Internal helpers for the journal-entries CQRS layer.
 *
 * @module journal-entries/application
 */

import type { TenantScope } from "@drenyra/domain/scope";
import {
	PostgresAccountingPeriodRepository,
	PostgresJournalEntryRepository,
} from "@drenyra/persistence";
import { and, eq } from "drizzle-orm";
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
 * Build the tenant scope for a request from its authenticated company.
 *
 * @throws Error if the request carries no company context.
 */
export async function resolveTenantScope(
	companyId: string | undefined,
): Promise<TenantScope> {
	if (!companyId) {
		throw new Error("Contexto de empresa requerido");
	}
	const organizationId = await resolveOrganizationId(companyId);
	return { organizationId: String(organizationId), companyId };
}

/**
 * Inline AccountService for journal entry creation.
 * Queries the PCGE accounts table to resolve account codes/names.
 */
export const accountService = {
	async getById(
		scope: TenantScope,
		id: string,
	): Promise<{ code: string; name: string } | null> {
		const row = await db.query.pcgeAccounts.findFirst({
			where: and(
				eq(schema.pcgeAccounts.id, id),
				eq(schema.pcgeAccounts.companyId, scope.companyId),
			),
		});
		if (!row) return null;
		return { code: row.code, name: row.name };
	},
};
