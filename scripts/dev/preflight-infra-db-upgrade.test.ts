import { describe, expect, test } from "bun:test";
import {
	classifyUpgradePreflight,
	INVENTORY_STATUS,
	PREFLIGHT_EXIT_CODE,
	PREFLIGHT_STATUS,
	parsePsqlCatalogState,
	type UpgradePreflightInput,
	validateUpgradePreflightEnvironment,
} from "./preflight-infra-db-upgrade";

const UPGRADEABLE_STATE: UpgradePreflightInput = {
	hasMigrationMetadata: true,
	publicApplicationTableCount: 12,
	appliedMigrationCount: 7,
	lastMigrationTag: "migration-hash",
	hasVectorExtension: true,
	inventoryStatus: INVENTORY_STATUS.COHERENT,
};

describe("classifyUpgradePreflight", () => {
	test("classifies a database without metadata or application tables as fresh", () => {
		const result = classifyUpgradePreflight({
			...UPGRADEABLE_STATE,
			hasMigrationMetadata: false,
			publicApplicationTableCount: 0,
			appliedMigrationCount: null,
			lastMigrationTag: null,
			hasVectorExtension: false,
		});

		expect(result.status).toBe(PREFLIGHT_STATUS.FRESH_DATABASE);
		expect(result.exitCode).toBe(PREFLIGHT_EXIT_CODE.READY);
		expect(result.recommendation).toContain("db:bootstrap");
	});

	test("classifies empty metadata with application tables as ambiguous", () => {
		const result = classifyUpgradePreflight({
			...UPGRADEABLE_STATE,
			appliedMigrationCount: 0,
			lastMigrationTag: null,
		});

		expect(result.status).toBe(PREFLIGHT_STATUS.AMBIGUOUS_EXISTING_SCHEMA);
		expect(result.exitCode).toBe(PREFLIGHT_EXIT_CODE.BLOCKED);
	});

	test("classifies application tables without migration metadata", () => {
		const result = classifyUpgradePreflight({
			...UPGRADEABLE_STATE,
			hasMigrationMetadata: false,
			appliedMigrationCount: null,
			lastMigrationTag: null,
		});

		expect(result.status).toBe(PREFLIGHT_STATUS.MIGRATION_METADATA_MISSING);
		expect(result.exitCode).toBe(PREFLIGHT_EXIT_CODE.BLOCKED);
	});

	test("classifies an upgradeable inventory without vector support", () => {
		const result = classifyUpgradePreflight({
			...UPGRADEABLE_STATE,
			hasVectorExtension: false,
		});

		expect(result.status).toBe(PREFLIGHT_STATUS.MISSING_VECTOR_EXTENSION);
		expect(result.exitCode).toBe(PREFLIGHT_EXIT_CODE.BLOCKED);
	});

	test("classifies repository migration inventory drift", () => {
		const result = classifyUpgradePreflight({
			...UPGRADEABLE_STATE,
			inventoryStatus: INVENTORY_STATUS.DRIFT,
		});

		expect(result.status).toBe(PREFLIGHT_STATUS.MIGRATION_INVENTORY_DRIFT);
		expect(result.exitCode).toBe(PREFLIGHT_EXIT_CODE.BLOCKED);
	});

	test("requires a controlled forward repair for an otherwise upgradeable state", () => {
		const result = classifyUpgradePreflight(UPGRADEABLE_STATE);

		expect(result.status).toBe(
			PREFLIGHT_STATUS.CONTROLLED_FORWARD_REPAIR_REQUIRED,
		);
		expect(result.exitCode).toBe(PREFLIGHT_EXIT_CODE.READY);
	});
});

describe("parsePsqlCatalogState", () => {
	test("parses the single JSON row emitted by psql", () => {
		const state = parsePsqlCatalogState(
			`${JSON.stringify({
				hasMigrationMetadata: true,
				publicApplicationTableCount: 3,
				appliedMigrationCount: 2,
				lastMigrationTag: "hash-2",
				hasVectorExtension: true,
			})}\n`,
		);

		expect(state.appliedMigrationCount).toBe(2);
		expect(state.lastMigrationTag).toBe("hash-2");
	});

	test("fails closed on malformed psql output", () => {
		expect(() => parsePsqlCatalogState("not-json")).toThrow(
			"psql_output_invalid_json",
		);
		expect(() =>
			parsePsqlCatalogState(
				'{"hasMigrationMetadata":false,"publicApplicationTableCount":0,"appliedMigrationCount":1,"lastMigrationTag":null,"hasVectorExtension":false}',
			),
		).toThrow("psql_output_metadata_state_inconsistent");
	});
});

describe("validateUpgradePreflightEnvironment", () => {
	const LOCAL_DATABASE_URL =
		"postgresql://developer:secret@127.0.0.1/drenyra_dev";

	test("requires explicit opt-in", () => {
		expect(() =>
			validateUpgradePreflightEnvironment({ DATABASE_URL: LOCAL_DATABASE_URL }),
		).toThrow("explicit_opt_in_required");
	});

	test("requires DATABASE_URL", () => {
		expect(() =>
			validateUpgradePreflightEnvironment({ DRENYA_UPGRADE_PREFLIGHT: "1" }),
		).toThrow("database_url_required");
	});

	test("accepts an explicitly opted-in local PostgreSQL database", () => {
		expect(
			validateUpgradePreflightEnvironment({
				DATABASE_URL: LOCAL_DATABASE_URL,
				DRENYA_UPGRADE_PREFLIGHT: "1",
			}),
		).toEqual({ databaseUrl: LOCAL_DATABASE_URL });
	});

	test("accepts the local Compose default password with explicit opt-in", () => {
		const composeDefaultUrl =
			"postgresql://user:password@127.0.0.1/drenyra_dev";

		expect(
			validateUpgradePreflightEnvironment({
				DATABASE_URL: composeDefaultUrl,
				DRENYA_UPGRADE_PREFLIGHT: "1",
			}),
		).toEqual({ databaseUrl: composeDefaultUrl });
	});

	test.each([
		[
			"placeholder",
			"postgresql://developer:changeme@localhost/drenyra_dev",
			"database_url_contains_placeholder",
		],
		[
			"non-PostgreSQL protocol",
			"mysql://developer:secret@localhost/drenyra_dev",
			"database_url_must_use_postgres",
		],
		[
			"non-local host",
			"postgresql://developer:secret@db.internal/drenyra_dev",
			"database_host_must_be_local",
		],
		[
			"production database name",
			"postgresql://developer:secret@localhost/drenyra_production",
			"production_database_name_rejected",
		],
	] as const)("rejects %s", (_case, databaseUrl, expectedError) => {
		expect(() =>
			validateUpgradePreflightEnvironment({
				DATABASE_URL: databaseUrl,
				DRENYA_UPGRADE_PREFLIGHT: "1",
			}),
		).toThrow(expectedError);
	});
});
