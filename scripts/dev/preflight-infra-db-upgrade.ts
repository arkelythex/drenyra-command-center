import { resolve } from "node:path";

export const PREFLIGHT_STATUS = {
	FRESH_DATABASE: "fresh_database",
	AMBIGUOUS_EXISTING_SCHEMA: "ambiguous_existing_schema",
	MIGRATION_METADATA_MISSING: "migration_metadata_missing",
	MISSING_VECTOR_EXTENSION: "missing_vector_extension",
	MIGRATION_INVENTORY_DRIFT: "migration_inventory_drift",
	CONTROLLED_FORWARD_REPAIR_REQUIRED: "controlled_forward_repair_required",
} as const;

export type PreflightStatus =
	(typeof PREFLIGHT_STATUS)[keyof typeof PREFLIGHT_STATUS];

export const INVENTORY_STATUS = {
	COHERENT: "coherent",
	DRIFT: "drift",
} as const;

export type InventoryStatus =
	(typeof INVENTORY_STATUS)[keyof typeof INVENTORY_STATUS];

export const PREFLIGHT_EXIT_CODE = {
	READY: 0,
	BLOCKED: 1,
	ERROR: 2,
} as const;

export type PreflightExitCode =
	(typeof PREFLIGHT_EXIT_CODE)[keyof typeof PREFLIGHT_EXIT_CODE];

export const PREFLIGHT_RECOMMENDATION = {
	USE_BOOTSTRAP: "Use db:bootstrap for this fresh database.",
	STOP_FOR_INSPECTION:
		"Stop and ask a maintainer to inspect the existing schema before proceeding.",
	RESTORE_METADATA:
		"Stop: application tables exist without migration metadata; maintainer inspection is required.",
	INSTALL_VECTOR:
		"Stop: install the vector extension through an approved controlled operation before upgrading.",
	REPAIR_INVENTORY:
		"Stop: the repository migration inventory has drift; prepare a controlled forward repair without rewriting history.",
	CONTROLLED_FORWARD_REPAIR:
		"Prepare a controlled forward repair; do not replay or rewrite historical migrations.",
} as const;

export type PreflightRecommendation =
	(typeof PREFLIGHT_RECOMMENDATION)[keyof typeof PREFLIGHT_RECOMMENDATION];

export interface CatalogState {
	hasMigrationMetadata: boolean;
	publicApplicationTableCount: number;
	appliedMigrationCount: number | null;
	lastMigrationTag: string | null;
	hasVectorExtension: boolean;
}

export interface UpgradePreflightInput extends CatalogState {
	inventoryStatus: InventoryStatus;
}

export interface UpgradePreflightClassification {
	status: PreflightStatus;
	recommendation: PreflightRecommendation;
	exitCode: PreflightExitCode;
}

export interface UpgradePreflightEnvironment {
	databaseUrl: string;
}

interface InventoryGuardOutput {
	status: InventoryStatus;
}

interface PreflightSuccessOutput extends UpgradePreflightClassification {
	catalogState: CatalogState;
	inventoryStatus: InventoryStatus;
	databaseChangesMade: false;
	historicalMigrationFilesOrJournalChanged: false;
	message: string;
}

interface PreflightErrorOutput {
	status: "input_or_query_error";
	error: string;
	exitCode: typeof PREFLIGHT_EXIT_CODE.ERROR;
	databaseChangesMade: false;
	historicalMigrationFilesOrJournalChanged: false;
	message: string;
}

export class PreflightInputError extends Error {
	constructor(readonly code: string) {
		super(code);
	}
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const PLACEHOLDER_PATTERN =
	/(?:<[^>]+>|\$\{[^}]+\}|\b(?:changeme|placeholder|replace_me|your_password|your_database|example)\b)/i;
const REPOSITORY_ROOT = resolve(import.meta.dir, "../..");
const INVENTORY_GUARD_PATH = resolve(
	import.meta.dir,
	"validate-infra-migration-inventory.ts",
);
const NO_CHANGES_MESSAGE =
	"Read-only preflight completed. No database changes were made, and historical migration files and journal were not changed.";

const CATALOG_QUERY = `
WITH catalog_state AS (
	SELECT
		to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS has_migration_metadata,
		(
			SELECT count(*)::integer
			FROM pg_catalog.pg_class AS application_class
			JOIN pg_catalog.pg_namespace AS application_namespace
				ON application_namespace.oid = application_class.relnamespace
			WHERE application_namespace.nspname = 'public'
				AND application_class.relkind IN ('r', 'p')
		) AS public_application_table_count,
		EXISTS (
			SELECT 1
			FROM pg_catalog.pg_extension
			WHERE extname = 'vector'
		) AS has_vector_extension
), migration_state AS (
	SELECT
		catalog_state.*,
		CASE
			WHEN has_migration_metadata THEN pg_catalog.query_to_xml(
				$query$
					SELECT
						count(*)::integer AS applied_migration_count,
						(
							SELECT COALESCE(to_jsonb(latest_migration)->>'tag', to_jsonb(latest_migration)->>'hash')
							FROM drizzle.__drizzle_migrations AS latest_migration
							ORDER BY to_jsonb(latest_migration)->>'created_at' DESC,
								to_jsonb(latest_migration)->>'id' DESC
							LIMIT 1
						) AS last_migration_tag
					FROM drizzle.__drizzle_migrations
				$query$,
				true,
				false,
				''
			)
			ELSE NULL
		END AS migration_xml
	FROM catalog_state
)
SELECT pg_catalog.json_build_object(
	'hasMigrationMetadata', has_migration_metadata,
	'publicApplicationTableCount', public_application_table_count,
	'appliedMigrationCount', CASE
		WHEN migration_xml IS NULL THEN NULL
		ELSE ((xpath('/table/row/applied_migration_count/text()', migration_xml))[1]::text)::integer
	END,
	'lastMigrationTag', CASE
		WHEN migration_xml IS NULL THEN NULL
		ELSE (xpath('/table/row/last_migration_tag/text()', migration_xml))[1]::text
	END,
	'hasVectorExtension', has_vector_extension
)::text
FROM migration_state;
`;

if (import.meta.main) {
	await runCli();
}

export function classifyUpgradePreflight(
	input: UpgradePreflightInput,
): UpgradePreflightClassification {
	if (!input.hasMigrationMetadata) {
		return input.publicApplicationTableCount === 0
			? classification(
					PREFLIGHT_STATUS.FRESH_DATABASE,
					PREFLIGHT_RECOMMENDATION.USE_BOOTSTRAP,
					PREFLIGHT_EXIT_CODE.READY,
				)
			: classification(
					PREFLIGHT_STATUS.MIGRATION_METADATA_MISSING,
					PREFLIGHT_RECOMMENDATION.RESTORE_METADATA,
					PREFLIGHT_EXIT_CODE.BLOCKED,
				);
	}

	const migrationStateIsAmbiguous =
		input.appliedMigrationCount === null ||
		input.publicApplicationTableCount === 0 ||
		input.appliedMigrationCount === 0 ||
		input.lastMigrationTag === null;
	if (migrationStateIsAmbiguous) {
		return classification(
			PREFLIGHT_STATUS.AMBIGUOUS_EXISTING_SCHEMA,
			PREFLIGHT_RECOMMENDATION.STOP_FOR_INSPECTION,
			PREFLIGHT_EXIT_CODE.BLOCKED,
		);
	}

	if (input.inventoryStatus === INVENTORY_STATUS.DRIFT) {
		return classification(
			PREFLIGHT_STATUS.MIGRATION_INVENTORY_DRIFT,
			PREFLIGHT_RECOMMENDATION.REPAIR_INVENTORY,
			PREFLIGHT_EXIT_CODE.BLOCKED,
		);
	}

	if (!input.hasVectorExtension) {
		return classification(
			PREFLIGHT_STATUS.MISSING_VECTOR_EXTENSION,
			PREFLIGHT_RECOMMENDATION.INSTALL_VECTOR,
			PREFLIGHT_EXIT_CODE.BLOCKED,
		);
	}

	return classification(
		PREFLIGHT_STATUS.CONTROLLED_FORWARD_REPAIR_REQUIRED,
		PREFLIGHT_RECOMMENDATION.CONTROLLED_FORWARD_REPAIR,
		PREFLIGHT_EXIT_CODE.READY,
	);
}

export function validateUpgradePreflightEnvironment(
	environment: Readonly<Record<string, string | undefined>>,
): UpgradePreflightEnvironment {
	if (environment.DRENYA_UPGRADE_PREFLIGHT !== "1") {
		throw new PreflightInputError("explicit_opt_in_required");
	}

	const databaseUrl = environment.DATABASE_URL;
	if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
		throw new PreflightInputError("database_url_required");
	}
	if (PLACEHOLDER_PATTERN.test(databaseUrl)) {
		throw new PreflightInputError("database_url_contains_placeholder");
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(databaseUrl);
	} catch {
		throw new PreflightInputError("database_url_invalid");
	}

	if (
		parsedUrl.protocol !== "postgres:" &&
		parsedUrl.protocol !== "postgresql:"
	) {
		throw new PreflightInputError("database_url_must_use_postgres");
	}
	if (!LOCAL_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
		throw new PreflightInputError("database_host_must_be_local");
	}

	const databaseName = decodeDatabaseName(parsedUrl.pathname);
	const decodedCredentials = `${decodeUrlComponent(parsedUrl.username)}:${decodeUrlComponent(parsedUrl.password)}`;
	if (
		PLACEHOLDER_PATTERN.test(databaseName) ||
		PLACEHOLDER_PATTERN.test(decodedCredentials)
	) {
		throw new PreflightInputError("database_url_contains_placeholder");
	}
	if (databaseName.toLowerCase().includes("prod")) {
		throw new PreflightInputError("production_database_name_rejected");
	}

	return { databaseUrl };
}

export function parsePsqlCatalogState(output: string): CatalogState {
	const lines = output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length !== 1) {
		throw new PreflightInputError("psql_output_must_contain_one_json_row");
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(lines[0]);
	} catch {
		throw new PreflightInputError("psql_output_invalid_json");
	}
	if (!isRecord(parsed)) {
		throw new PreflightInputError("psql_output_must_be_an_object");
	}

	const hasMigrationMetadata = readBoolean(parsed, "hasMigrationMetadata");
	const publicApplicationTableCount = readNonnegativeInteger(
		parsed,
		"publicApplicationTableCount",
	);
	const appliedMigrationCount = readNullableNonnegativeInteger(
		parsed,
		"appliedMigrationCount",
	);
	const lastMigrationTag = readNullableString(parsed, "lastMigrationTag");
	const hasVectorExtension = readBoolean(parsed, "hasVectorExtension");

	if (
		!hasMigrationMetadata &&
		(appliedMigrationCount !== null || lastMigrationTag !== null)
	) {
		throw new PreflightInputError("psql_output_metadata_state_inconsistent");
	}

	return {
		hasMigrationMetadata,
		publicApplicationTableCount,
		appliedMigrationCount,
		lastMigrationTag,
		hasVectorExtension,
	};
}

async function runCli(): Promise<void> {
	try {
		const environment = validateUpgradePreflightEnvironment(process.env);
		const inventoryStatus = runInventoryGuard();
		const catalogState = runCatalogQuery(environment.databaseUrl);
		const result = classifyUpgradePreflight({
			...catalogState,
			inventoryStatus,
		});
		const output: PreflightSuccessOutput = {
			...result,
			catalogState,
			inventoryStatus,
			databaseChangesMade: false,
			historicalMigrationFilesOrJournalChanged: false,
			message: NO_CHANGES_MESSAGE,
		};
		console.log(JSON.stringify(output, null, 2));
		process.exitCode = result.exitCode;
	} catch (error) {
		const code =
			error instanceof PreflightInputError ? error.code : "unexpected_error";
		const output: PreflightErrorOutput = {
			status: "input_or_query_error",
			error: code,
			exitCode: PREFLIGHT_EXIT_CODE.ERROR,
			databaseChangesMade: false,
			historicalMigrationFilesOrJournalChanged: false,
			message:
				"Preflight stopped without changing the database, historical migration files, or journal.",
		};
		console.error(JSON.stringify(output, null, 2));
		process.exitCode = PREFLIGHT_EXIT_CODE.ERROR;
	}
}

function runCatalogQuery(databaseUrl: string): CatalogState {
	const subprocess = Bun.spawnSync(
		[
			"psql",
			"-X",
			"-v",
			"ON_ERROR_STOP=1",
			"--dbname",
			databaseUrl,
			"-tA",
			"-c",
			CATALOG_QUERY,
		],
		{ stdout: "pipe", stderr: "pipe" },
	);
	if (subprocess.exitCode !== 0) {
		throw new PreflightInputError("psql_query_failed");
	}
	return parsePsqlCatalogState(new TextDecoder().decode(subprocess.stdout));
}

function runInventoryGuard(): InventoryStatus {
	const subprocess = Bun.spawnSync([process.execPath, INVENTORY_GUARD_PATH], {
		cwd: REPOSITORY_ROOT,
		stdout: "pipe",
		stderr: "pipe",
	});
	if (subprocess.exitCode !== 0 && subprocess.exitCode !== 1) {
		throw new PreflightInputError("migration_inventory_guard_failed");
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(new TextDecoder().decode(subprocess.stdout));
	} catch {
		throw new PreflightInputError("migration_inventory_guard_invalid_output");
	}
	if (!isInventoryGuardOutput(parsed)) {
		throw new PreflightInputError("migration_inventory_guard_invalid_output");
	}
	return parsed.status;
}

function classification(
	status: PreflightStatus,
	recommendation: PreflightRecommendation,
	exitCode: PreflightExitCode,
): UpgradePreflightClassification {
	return { status, recommendation, exitCode };
}

function decodeDatabaseName(pathname: string): string {
	const encodedName = pathname.replace(/^\//, "");
	if (encodedName.length === 0 || encodedName.includes("/")) {
		throw new PreflightInputError("database_name_required");
	}
	return decodeUrlComponent(encodedName);
}

function decodeUrlComponent(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		throw new PreflightInputError("database_url_invalid_encoding");
	}
}

function readBoolean(record: Record<string, unknown>, key: string): boolean {
	const candidate = record[key];
	if (typeof candidate !== "boolean") {
		throw new PreflightInputError(`psql_output_${key}_must_be_boolean`);
	}
	return candidate;
}

function readNonnegativeInteger(
	record: Record<string, unknown>,
	key: string,
): number {
	const candidate = record[key];
	if (
		typeof candidate !== "number" ||
		!Number.isSafeInteger(candidate) ||
		Math.sign(candidate) === -1
	) {
		throw new PreflightInputError(
			`psql_output_${key}_must_be_nonnegative_integer`,
		);
	}
	return candidate;
}

function readNullableNonnegativeInteger(
	record: Record<string, unknown>,
	key: string,
): number | null {
	return record[key] === null ? null : readNonnegativeInteger(record, key);
}

function readNullableString(
	record: Record<string, unknown>,
	key: string,
): string | null {
	const candidate = record[key];
	if (candidate === null) return null;
	if (typeof candidate !== "string" || candidate.trim().length === 0) {
		throw new PreflightInputError(`psql_output_${key}_must_be_string_or_null`);
	}
	return candidate;
}

function isInventoryGuardOutput(value: unknown): value is InventoryGuardOutput {
	return (
		isRecord(value) &&
		(value.status === INVENTORY_STATUS.COHERENT ||
			value.status === INVENTORY_STATUS.DRIFT)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
