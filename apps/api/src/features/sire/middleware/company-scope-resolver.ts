import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { eq } from "@arkelythex/persistence/query";
import { db, schema } from "../../../lib/db";

const legacyOrganizations = pgTable("organizations", {
	id: integer("id").primaryKey(),
	ruc: varchar("ruc", { length: 11 }).notNull(),
});

function normalizeLegacyOrganizationId(
	value: string | number | undefined,
): number | null {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		return value;
	}

	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return null;
		const parsed = Number(trimmed);
		if (Number.isFinite(parsed) && parsed > 0) {
			return parsed;
		}
	}

	return null;
}

/**
 * resolveCompanyIdFromLegacyOrganizationClaim operation.
 *
 * @param value - Input for value.
 * @returns Result of resolveCompanyIdFromLegacyOrganizationClaim.
 * @example
 * ```ts
 * const result = await resolveCompanyIdFromLegacyOrganizationClaim("");
 * console.log(result);
 * ```
 */
export async function resolveCompanyIdFromLegacyOrganizationClaim(
	value: string | number | undefined,
): Promise<string | null> {
	const organizationId = normalizeLegacyOrganizationId(value);
	if (!organizationId) {
		return null;
	}

	const organizationRows = await db
		.select({ ruc: legacyOrganizations.ruc })
		.from(legacyOrganizations)
		.where(eq(legacyOrganizations.id, organizationId))
		.limit(1);

	if (organizationRows.length === 0 || !organizationRows[0]) {
		return null;
	}

	const companyRows = await db
		.select({ id: schema.companies.id })
		.from(schema.companies)
		.where(eq(schema.companies.ruc, organizationRows[0].ruc))
		.limit(1);

	return companyRows[0]?.id ?? null;
}
