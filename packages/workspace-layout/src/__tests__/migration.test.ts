import { describe, it, expect } from "vitest";
import { applyLayoutMigrations } from "../domain/migration";
import { CURRENT_LAYOUT_SCHEMA_VERSION } from "../domain/layout";
import {
	LayoutMigrationError,
	LayoutSchemaVersionError,
} from "../domain/errors";

describe("applyLayoutMigrations", () => {
	it("should return identity when fromVersion equals toVersion", () => {
		const persisted = {
			schemaVersion: 1,
			layoutId: "l-1",
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "monthly-close",
			revision: 1,
			root: { kind: "view", viewId: "v1" },
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		};

		const layout = applyLayoutMigrations(persisted, 1, 1);
		expect(layout.layoutId).toBe("l-1");
		expect(layout.revision).toBe(1);
	});

	it("should migrate v1 to current (identity)", () => {
		const persisted = {
			schemaVersion: 1,
			layoutId: "l-2",
			workspaceId: "ws-2",
			ownerId: "owner-2",
			template: "sire-review",
			revision: 3,
			root: { kind: "view", viewId: "v2" },
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		};

		const layout = applyLayoutMigrations(
			persisted,
			1,
			CURRENT_LAYOUT_SCHEMA_VERSION,
		);
		expect(layout.layoutId).toBe("l-2");
		expect(layout.revision).toBe(3);
		expect(layout.template).toBe("sire-review");
	});

	it("should throw LayoutSchemaVersionError for version > current", () => {
		const persisted = {
			schemaVersion: 999,
			layoutId: "l-3",
			workspaceId: "ws-3",
			ownerId: "owner-3",
			template: "monthly-close",
			revision: 1,
			root: { kind: "view", viewId: "v3" },
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		};

		expect(() =>
			applyLayoutMigrations(persisted, 999, CURRENT_LAYOUT_SCHEMA_VERSION),
		).toThrow(LayoutSchemaVersionError);
	});

	it("should throw when schemaVersion is missing", () => {
		const persisted = {
			layoutId: "l-4",
			workspaceId: "ws-4",
		};

		expect(() =>
			applyLayoutMigrations(persisted, 1, CURRENT_LAYOUT_SCHEMA_VERSION),
		).toThrow(LayoutMigrationError);
	});

	it("should throw for unsupported version < 1", () => {
		const persisted = {
			schemaVersion: 0,
			layoutId: "l-5",
		};

		expect(() =>
			applyLayoutMigrations(persisted, 0, CURRENT_LAYOUT_SCHEMA_VERSION),
		).toThrow(LayoutSchemaVersionError);
	});
});
