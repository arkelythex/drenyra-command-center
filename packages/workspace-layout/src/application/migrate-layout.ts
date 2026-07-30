import { applyLayoutMigrations } from "../domain/migration";
import { CURRENT_LAYOUT_SCHEMA_VERSION } from "../domain/layout";
import { LayoutMigrationError } from "../domain/errors";
import type { WorkspaceLayout } from "../domain/layout";

/**
 * Migrate a persisted layout to the current schema version.
 * Reads schemaVersion from the persisted data and applies sequential migrations.
 */
export function migrateLayout(persisted: unknown): WorkspaceLayout {
	const source = persisted as Record<string, unknown>;
	const fromVersion = source.schemaVersion;

	if (typeof fromVersion !== "number") {
		throw new LayoutMigrationError(
			"Missing or invalid schemaVersion in persisted layout",
		);
	}

	if (fromVersion < 1) {
		throw new LayoutMigrationError(
			`Cannot migrate from version ${fromVersion}: minimum supported is 1`,
		);
	}

	if (fromVersion > CURRENT_LAYOUT_SCHEMA_VERSION) {
		throw new LayoutMigrationError(
			`Cannot migrate from version ${fromVersion}: exceeds current ${CURRENT_LAYOUT_SCHEMA_VERSION}`,
		);
	}

	return applyLayoutMigrations(
		persisted,
		fromVersion,
		CURRENT_LAYOUT_SCHEMA_VERSION,
	);
}
