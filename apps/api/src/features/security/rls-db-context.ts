import { sql } from "drizzle-orm";
import { db } from "../../lib/db";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface ExecutesSql {
	execute: (query: ReturnType<typeof sql>) => Promise<unknown>;
}

/**
 * Tenant context propagated into PostgreSQL session settings.
 *
 * @example
 * ```ts
 * const context: TenantRlsContext = { companyId: "cmp_1", userId: "usr_1" };
 * ```
 */
export interface TenantRlsContext {
	companyId: string;
	userId?: string | null;
}

/**
 * Applies tenant/user context to the current SQL execution scope.
 *
 * @param executor - SQL executor bound to current connection or transaction
 * @param context - Tenant context to set in PostgreSQL session vars
 * @returns Promise resolved after context is set
 * @example
 * ```ts
 * await applyTenantRlsContext(tx, { companyId: "cmp_1" });
 * ```
 */
export async function applyTenantRlsContext(
	executor: ExecutesSql,
	context: TenantRlsContext,
): Promise<void> {
	await executor.execute(
		sql`
      select
        set_config('arkelythex.current_company_id', ${context.companyId}, true),
        set_config('arkelythex.current_user_id', ${context.userId ?? ""}, true)
    `,
	);
}

/**
 * Runs a callback in a DB transaction with tenant RLS session context.
 *
 * @typeParam T - Return type produced by the transaction callback
 * @param context - Tenant context used to configure session-scoped guards
 * @param work - Transaction callback executed after applying RLS context
 * @returns Callback result
 * @example
 * ```ts
 * const result = await withTenantRlsTransaction({ companyId: "cmp_1" }, async () => "ok");
 * ```
 */
export async function withTenantRlsTransaction<T>(
	context: TenantRlsContext,
	work: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
	return db.transaction(async (tx) => {
		await applyTenantRlsContext(tx, context);
		return work(tx);
	});
}

/**
 * Runs a callback in a DB transaction scoped to one company id.
 *
 * @typeParam T - Return type produced by the transaction callback
 * @param companyId - Tenant company identifier
 * @param work - Transaction callback executed with scoped RLS context
 * @returns Callback result
 * @example
 * ```ts
 * const rows = await withCompanyRlsTransaction("cmp_1", async (tx) => tx.execute(sql`select 1`));
 * ```
 */
export async function withCompanyRlsTransaction<T>(
	companyId: string,
	work: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
	return withTenantRlsTransaction({ companyId }, work);
}
