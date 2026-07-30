import { describe, it, expect } from "vitest";
import { migrateLayout } from "../application/migrate-layout";
import { LayoutMigrationError } from "../domain/errors";

describe("migrateLayout", () => {
	it("should migrate a known version and return WorkspaceLayout", () => {
		const persisted = {
			schemaVersion: 1,
			layoutId: "l-1",
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "monthly-close",
			revision: 5,
			root: { kind: "view", viewId: "v1" },
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		};

		const layout = migrateLayout(persisted);
		expect(layout.layoutId).toBe("l-1");
		expect(layout.revision).toBe(5);
	});

	it("should throw LayoutMigrationError for unknown version", () => {
		const persisted = {
			schemaVersion: 999,
		};

		expect(() => migrateLayout(persisted)).toThrow(LayoutMigrationError);
	});

	it("should preserve revision after migration", () => {
		const persisted = {
			schemaVersion: 1,
			layoutId: "l-2",
			workspaceId: "ws-2",
			ownerId: "owner-2",
			template: "sire-review",
			revision: 7,
			root: { kind: "view", viewId: "v2" },
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		};

		const layout = migrateLayout(persisted);
		expect(layout.revision).toBe(7);
	});

	it("should throw for missing schemaVersion", () => {
		const persisted = { layoutId: "l-3" };

		expect(() => migrateLayout(persisted)).toThrow(LayoutMigrationError);
	});

	it("should throw for version 0", () => {
		const persisted = { schemaVersion: 0 };

		expect(() => migrateLayout(persisted)).toThrow(LayoutMigrationError);
	});
});
