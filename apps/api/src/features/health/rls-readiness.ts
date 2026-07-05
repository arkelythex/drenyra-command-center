import { db } from "@drenyra/persistence/client";
import { sql } from "@drenyra/persistence/query";

const RLS_TARGETS = [
	{ table: "invoices", policy: "invoices_tenant_guard" },
	{ table: "bills", policy: "bills_tenant_guard" },
	{ table: "business_partners", policy: "business_partners_tenant_guard" },
	{ table: "bank_accounts", policy: "bank_accounts_tenant_guard" },
	{ table: "bank_transactions", policy: "bank_transactions_tenant_guard" },
] as const;

type RlsStatus = "missing" | "partial" | "staged" | "enabled" | "error";

interface PolicyRow {
	tablename: string;
	policyname: string;
}

interface TableFlagRow {
	relname: string;
	relrowsecurity: boolean;
}

/**
 * Snapshot of PostgreSQL row-level security readiness for tenant tables.
 *
 * @example
 * ```ts
 * const status: RlsReadinessStatus = await getRlsReadinessStatus();
 * ```
 */
export interface RlsReadinessStatus {
	status: RlsStatus;
	targetCount: number;
	policyCount: number;
	enabledCount: number;
	missingPolicies: string[];
	pendingEnablement: string[];
}

/**
 * Computes readiness classification from policy and table-flag rows.
 *
 * @param policyRows - Rows from `pg_policies` for tenant-guarded tables
 * @param flagRows - Rows from `pg_class` with `relrowsecurity` flags
 * @returns Normalized RLS readiness status
 * @example
 * ```ts
 * const status = buildRlsReadinessStatus([], []);
 * ```
 */
export function buildRlsReadinessStatus(
	policyRows: PolicyRow[],
	flagRows: TableFlagRow[],
): RlsReadinessStatus {
	const policySet = new Set(
		policyRows.map((row) => `${row.tablename}:${row.policyname}`),
	);
	const flagMap = new Map(
		flagRows.map((row) => [row.relname, Boolean(row.relrowsecurity)]),
	);

	const missingPolicies = RLS_TARGETS.filter(
		(target) => !policySet.has(`${target.table}:${target.policy}`),
	).map((target) => target.table);

	const pendingEnablement = RLS_TARGETS.filter(
		(target) =>
			policySet.has(`${target.table}:${target.policy}`) &&
			flagMap.get(target.table) !== true,
	).map((target) => target.table);

	const enabledCount = RLS_TARGETS.filter(
		(target) =>
			policySet.has(`${target.table}:${target.policy}`) &&
			flagMap.get(target.table) === true,
	).length;

	const policyCount = RLS_TARGETS.length - missingPolicies.length;
	const allPoliciesPresent = missingPolicies.length === 0;
	const allEnabled = enabledCount === RLS_TARGETS.length;

	const status: RlsStatus = allEnabled
		? "enabled"
		: allPoliciesPresent
			? "staged"
			: policyCount === 0
				? "missing"
				: "partial";

	return {
		status,
		targetCount: RLS_TARGETS.length,
		policyCount,
		enabledCount,
		missingPolicies,
		pendingEnablement,
	};
}

interface DbExecutor {
	execute: typeof db.execute;
}

/**
 * Reads policy and table flags from PostgreSQL to classify RLS readiness.
 *
 * @param dbExecutor - Database executor (defaults to shared Drizzle client)
 * @returns RLS readiness snapshot for target tenant tables
 * @example
 * ```ts
 * const readiness = await getRlsReadinessStatus();
 * ```
 */
export async function getRlsReadinessStatus(
	dbExecutor: DbExecutor = db,
): Promise<RlsReadinessStatus> {
	try {
		const expectedTables = RLS_TARGETS.map((target) => target.table);
		const policiesResult = await dbExecutor.execute(
			sql`SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN (${sql.join(
				expectedTables.map((table) => sql`${table}`),
				sql`,`,
			)})`,
		);
		const flagsResult = await dbExecutor.execute(
			sql`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (${sql.join(
				expectedTables.map((table) => sql`${table}`),
				sql`,`,
			)})`,
		);

		return buildRlsReadinessStatus(
			extractPolicyRows(policiesResult),
			extractTableFlagRows(flagsResult),
		);
	} catch {
		return {
			status: "error",
			targetCount: RLS_TARGETS.length,
			policyCount: 0,
			enabledCount: 0,
			missingPolicies: RLS_TARGETS.map((target) => target.table),
			pendingEnablement: [],
		};
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getRows(value: unknown): unknown[] {
	const candidate = isRecord(value) ? value : undefined;
	const rowsValue = candidate?.rows;

	return Array.isArray(rowsValue)
		? rowsValue
		: Array.isArray(value)
			? value
			: [];
}

function extractPolicyRows(value: unknown): PolicyRow[] {
	return getRows(value)
		.map((row) => {
			if (!isRecord(row)) return null;
			const tablename = row.tablename;
			const policyname = row.policyname;
			if (typeof tablename !== "string" || typeof policyname !== "string") {
				return null;
			}
			return { tablename, policyname };
		})
		.filter((row): row is PolicyRow => row !== null);
}

function extractTableFlagRows(value: unknown): TableFlagRow[] {
	return getRows(value)
		.map((row) => {
			if (!isRecord(row)) return null;
			const relname = row.relname;
			const relrowsecurity = row.relrowsecurity;
			if (typeof relname !== "string" || typeof relrowsecurity !== "boolean") {
				return null;
			}
			return { relname, relrowsecurity };
		})
		.filter((row): row is TableFlagRow => row !== null);
}
