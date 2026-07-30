import type { WorkspaceLayout } from "./layout";
import { LayoutMigrationError, LayoutSchemaVersionError } from "./errors";
import { CURRENT_LAYOUT_SCHEMA_VERSION } from "./layout";

// ─── Migration Function Type ────────────────────────────────────────────────

export type LayoutMigration = (
	persisted: unknown,
) =>
	| { ok: true; layout: WorkspaceLayout }
	| { ok: false; error: LayoutMigrationError };

// ─── Known Migrations ───────────────────────────────────────────────────────

/**
 * v1 → current: identity (schema shape is stable, no transformation needed).
 */
function migrateV1ToCurrent(persisted: unknown): WorkspaceLayout {
	const source = persisted as Record<string, unknown>;

	const schemaVersion = source.schemaVersion;
	if (typeof schemaVersion !== "number" || schemaVersion !== 1) {
		throw new LayoutMigrationError(
			`v1 migration expects schemaVersion=1, got ${String(schemaVersion)}`,
		);
	}

	return source as unknown as WorkspaceLayout;
}

// ─── Migration Registry ─────────────────────────────────────────────────────

const MIGRATIONS: Record<number, LayoutMigration> = {
	1: (persisted: unknown) => {
		try {
			return { ok: true, layout: migrateV1ToCurrent(persisted) };
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Unknown migration error";
			return { ok: false, error: new LayoutMigrationError(message) };
		}
	},
};

// ─── Apply Migrations ───────────────────────────────────────────────────────

export function applyLayoutMigrations(
	persisted: unknown,
	fromVersion: number,
	toVersion: number,
): WorkspaceLayout {
	const source = persisted as Record<string, unknown>;
	const sv = source.schemaVersion;

	if (typeof sv !== "number") {
		throw new LayoutMigrationError(
			"Missing or invalid schemaVersion in persisted layout",
		);
	}

	if (fromVersion === toVersion) {
		return source as unknown as WorkspaceLayout;
	}

	if (sv < 1) {
		throw new LayoutSchemaVersionError(sv, CURRENT_LAYOUT_SCHEMA_VERSION);
	}

	if (sv > CURRENT_LAYOUT_SCHEMA_VERSION) {
		throw new LayoutSchemaVersionError(sv, CURRENT_LAYOUT_SCHEMA_VERSION);
	}

	// Apply migrations from sv to toVersion
	let current = persisted;
	for (let v = sv; v < toVersion; v++) {
		const migration = MIGRATIONS[v];
		if (!migration) {
			throw new LayoutMigrationError(
				`No migration found for version ${v} → ${v + 1}`,
			);
		}
		const result = migration(current);
		if (!result.ok) {
			throw result.error;
		}
		current = result.layout as unknown;
	}

	return current as unknown as WorkspaceLayout;
}
