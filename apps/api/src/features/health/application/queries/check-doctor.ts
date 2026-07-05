/**
 * CheckDoctorQuery — Performs the /health/doctor diagnostic check.
 *
 * Extracted from the inline route handler for CQRS compliance.
 *
 * @module health/application/queries
 */

import { sql } from "@drenyra/persistence/query";
import type { BackupReadinessStatus } from "../../backup-readiness";
import type { OpenTelemetryReadiness } from "../../otel-readiness";
import type { RlsReadinessStatus } from "../../rls-readiness";

export type TaxationBootstrapStatus =
	| { status: "not_configured" }
	| { status: "ready" }
	| { status: "disabled"; error: string };

export interface DoctorCheckResult {
	status: "ok" | "degraded";
	timestamp: string;
	env: Record<string, unknown>;
	checks: {
		database: { status: "ok" | "error"; error?: string };
		tables:
			| { status: "ok" | "missing"; missing?: string[] }
			| { status: "error" | "skipped"; error?: string };
		backups: BackupReadinessStatus;
		otel: OpenTelemetryReadiness;
		rls: RlsReadinessStatus;
		taxationEvents: TaxationBootstrapStatus;
	};
	hints: string[];
}

export interface DoctorCheckDeps {
	dbExecute: (query: ReturnType<typeof sql>) => Promise<unknown>;
	loggerInfo: (obj: Record<string, unknown>, msg: string) => void;
	readBackupReadiness: () => Promise<BackupReadinessStatus>;
	readOpenTelemetryReadiness: () => OpenTelemetryReadiness;
	readRlsReadiness: () => Promise<RlsReadinessStatus>;
	readTaxationBootstrapStatus: () => TaxationBootstrapStatus;
}

const REQUIRED_TABLES = [
	"auth_users",
	"auth_sessions",
	"bank_accounts",
	"bank_transactions",
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function extractTableNameRows(value: unknown): Array<{ table_name: string }> {
	const candidate = isRecord(value) ? value : undefined;
	const rowsValue = candidate?.rows;

	const rows = Array.isArray(rowsValue)
		? rowsValue
		: Array.isArray(value)
			? value
			: [];

	return rows
		.map((row) => (isRecord(row) ? row.table_name : undefined))
		.filter((tableName): tableName is string => typeof tableName === "string")
		.map((table_name) => ({ table_name }));
}

/**
 * Performs the health diagnostic (doctor) check.
 *
 * @param deps - Injected dependencies for all sub-checks
 * @returns The full diagnostic result with hints
 *
 * @example
 * ```ts
 * const result = await checkDoctor({
 *   dbExecute, loggerInfo, readBackupReadiness, ...
 * });
 * ```
 */
export async function checkDoctor(
	deps: DoctorCheckDeps,
): Promise<DoctorCheckResult> {
	const {
		dbExecute,
		loggerInfo,
		readBackupReadiness,
		readOpenTelemetryReadiness,
		readRlsReadiness,
		readTaxationBootstrapStatus,
	} = deps;

	const env = {
		NODE_ENV: process.env.NODE_ENV ?? "development",
		PORT: process.env.PORT ?? "3000",
		API_ENTRYPOINT: "standard (app-core)",
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "(missing)",
		DATABASE_URL_SET: Boolean(process.env.DATABASE_URL),
		NATS_URL_SET: Boolean(process.env.NATS_URL),
		BETTER_AUTH_SECRET_LEN: (process.env.BETTER_AUTH_SECRET ?? "").length,
	};

	const hints: string[] = [];
	if (!process.env.DATABASE_URL) {
		hints.push("Missing DATABASE_URL (API will not be able to query Postgres)");
	}
	if ((process.env.BETTER_AUTH_SECRET ?? "").length < 32) {
		hints.push("BETTER_AUTH_SECRET should be at least 32 chars");
	}
	if ((process.env.BETTER_AUTH_SECRET ?? "").includes("$(")) {
		hints.push(
			"BETTER_AUTH_SECRET contains '$(' (shell expansion won't run in .env parsing)",
		);
	}

	const dbCheck = await dbExecute(sql`SELECT 1 as ok`)
		.then(() => ({ status: "ok" as const }))
		.catch((error: unknown) => ({
			status: "error" as const,
			error: error instanceof Error ? error.message : String(error),
		}));

	const tableCheck =
		dbCheck.status === "ok"
			? await dbExecute(
					sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN (${sql.join(
						REQUIRED_TABLES.map((table) => sql`${table}`),
						sql`,`,
					)})`,
				)
					.then((result: unknown) => {
						const rows = extractTableNameRows(result);
						const present = new Set(rows.map((row) => row.table_name));
						const missing = REQUIRED_TABLES.filter(
							(table) => !present.has(table),
						);
						return {
							status:
								missing.length === 0 ? ("ok" as const) : ("missing" as const),
							missing,
						};
					})
					.catch((error: unknown) => ({
						status: "error" as const,
						error: error instanceof Error ? error.message : String(error),
					}))
			: { status: "skipped" as const };

	if (tableCheck.status === "missing") {
		hints.push("Database schema missing tables. Run: `bun run db:push`");
	}

	if (dbCheck.status !== "ok") {
		hints.push(
			"Postgres not reachable. Try: `docker compose up -d postgres` and verify DATABASE_URL",
		);
	}

	const backupReadiness = await readBackupReadiness();
	const otelReadiness = readOpenTelemetryReadiness();
	const rlsReadiness = await readRlsReadiness();
	const taxationEvents = readTaxationBootstrapStatus();

	if (backupReadiness.status === "missing") {
		hints.push(
			"No PostgreSQL backup evidence found. Run: `bun run ops:db:backup` and verify with `bun run ops:db:restore:verify -- <dump>`",
		);
	}

	if (backupReadiness.status === "warning") {
		hints.push(
			`PostgreSQL backup is older than ${backupReadiness.thresholdHours}h. Create a fresh backup before risky changes.`,
		);
	}

	if (backupReadiness.status === "error") {
		hints.push(
			"Unable to inspect backup directory. Verify ARKELYTHEX_BACKUP_DIR permissions and contents.",
		);
	}

	if (otelReadiness.status === "disabled") {
		hints.push(
			"OpenTelemetry is disabled. Set ARKELYTHEX_ENABLE_OTEL=true and OTEL_EXPORTER_OTLP_ENDPOINT to enable production tracing.",
		);
	}

	if (otelReadiness.status === "config_invalid") {
		hints.push(
			"OpenTelemetry is enabled but OTEL_EXPORTER_OTLP_ENDPOINT is missing. Configure an OTLP endpoint before relying on traces.",
		);
	}

	if (rlsReadiness.status === "staged") {
		hints.push(
			`Tenant RLS policies are staged for ${rlsReadiness.policyCount}/${rlsReadiness.targetCount} tables but PostgreSQL RLS is still disabled on: ${rlsReadiness.pendingEnablement.join(", ")}`,
		);
	}

	if (rlsReadiness.status === "partial") {
		hints.push(
			`Tenant RLS staging is incomplete. Missing policies on: ${rlsReadiness.missingPolicies.join(", ")}`,
		);
	}

	if (rlsReadiness.status === "missing") {
		hints.push(
			"Tenant RLS policies have not been staged yet. Apply the next RLS migration before enabling row-level security.",
		);
	}

	if (rlsReadiness.status === "error") {
		hints.push(
			"Unable to inspect PostgreSQL RLS readiness. Verify database permissions and pg_catalog access.",
		);
	}

	if (taxationEvents.status === "not_configured") {
		hints.push(
			"NATS_URL is not configured. Taxation retention event subscriptions are skipped and event-driven observability remains disabled.",
		);
	}

	if (taxationEvents.status === "disabled") {
		hints.push(
			`Taxation retention event subscriptions failed to bootstrap: ${taxationEvents.error}`,
		);
	}

	return {
		status: dbCheck.status === "ok" ? "ok" : "degraded",
		timestamp: new Date().toISOString(),
		env,
		checks: {
			database: dbCheck,
			tables: tableCheck,
			backups: backupReadiness,
			otel: otelReadiness,
			rls: rlsReadiness,
			taxationEvents,
		},
		hints,
	};
}
