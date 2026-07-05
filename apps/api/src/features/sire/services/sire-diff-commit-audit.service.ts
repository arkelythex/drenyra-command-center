import { db } from "@drenyra/persistence/client";
import { and, eq, sql } from "@drenyra/persistence/query";
import { authAuditLogs } from "@drenyra/persistence/schema";

const SIRE_DIFF_COMMIT_ACTION = "SIRE_DIFF_COMMIT";

/**
 * Returns true when an artifact audit row exists for a committed SIRE diff in the period.
 */
export async function hasSireDiffCommitAuditForPeriod(input: {
	companyId: string;
	period: string;
}): Promise<boolean> {
	const rows = await db
		.select({ id: authAuditLogs.id })
		.from(authAuditLogs)
		.where(
			and(
				eq(authAuditLogs.action, SIRE_DIFF_COMMIT_ACTION),
				sql`${authAuditLogs.details}->>'type' = 'ARTIFACT_EVENT'`,
				sql`${authAuditLogs.details}->>'companyId' = ${input.companyId}`,
				sql`${authAuditLogs.details}->'payload'->>'period' = ${input.period}`,
			),
		)
		.limit(1);

	return rows.length > 0;
}
