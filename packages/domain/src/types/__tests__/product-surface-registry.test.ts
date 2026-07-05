/**
 * Unit Tests for Product Surface Registry
 */

import { describe, expect, it } from "vitest";
import {
	ARKELYTHEX_PRODUCT_SURFACES,
	getDrenyraProductSurface,
} from "../product-surface-registry";
import type { DrenyraProductSurface } from "../product-surfaces";

describe("ARKELYTHEX_PRODUCT_SURFACES", () => {
	it("should contain all expected product surfaces", () => {
		const ids = ARKELYTHEX_PRODUCT_SURFACES.map((s) => s.id);
		expect(ids).toContain("drenyra");
		expect(ids).toContain("ledger");
		expect(ids).toContain("studio");
		expect(ids).toContain("cortex");
		expect(ids).toContain("api");
		expect(ids).toContain("gov");
		expect(ids).toContain("landing");
		expect(ids).toContain("grid");
	});

	it("should have no duplicate IDs", () => {
		const ids = ARKELYTHEX_PRODUCT_SURFACES.map((s) => s.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	it("each surface should have required fields", () => {
		for (const surface of ARKELYTHEX_PRODUCT_SURFACES) {
			expect(surface.id).toBeTruthy();
			expect(surface.name).toBeTruthy();
			expect(surface.summary).toBeTruthy();
			expect(surface.status).toBeTruthy();
			expect(surface.canonicalHome).toBeTruthy();
			expect(Array.isArray(surface.documentationRefs)).toBe(true);
			expect(Array.isArray(surface.modules)).toBe(true);
		}
	});

	it("each module should have kind, path, and role", () => {
		for (const surface of ARKELYTHEX_PRODUCT_SURFACES) {
			for (const mod of surface.modules) {
				expect(mod.kind).toBeTruthy();
				expect(mod.path).toBeTruthy();
				expect(mod.role).toBeTruthy();
			}
		}
	});

	it("each surface should have a valid status", () => {
		const validStatuses = [
			"canonical-in-core",
			"strategy-layer",
			"separate-runtime",
		];
		for (const surface of ARKELYTHEX_PRODUCT_SURFACES) {
			expect(validStatuses).toContain(surface.status);
		}
	});

	it("each module should have a valid kind", () => {
		const validKinds = ["app", "package", "feature", "doc", "doc-gen"];
		for (const surface of ARKELYTHEX_PRODUCT_SURFACES) {
			for (const mod of surface.modules) {
				expect(validKinds).toContain(mod.kind);
			}
		}
	});
});

describe("getDrenyraProductSurface", () => {
	it("should return the surface by ID", () => {
		const surface = getDrenyraProductSurface("drenyra");
		expect(surface).toBeDefined();
		expect(surface!.id).toBe("drenyra");
		expect(surface!.name).toBe("ARKELYTHEX Drenyra");
	});

	it("should return undefined for unknown ID", () => {
		const surface = getDrenyraProductSurface(
			"nonexistent" as DrenyraProductSurface["id"],
		);
		expect(surface).toBeUndefined();
	});

	it("should find gov surface", () => {
		const surface = getDrenyraProductSurface("gov");
		expect(surface).toBeDefined();
		expect(surface!.status).toBe("strategy-layer");
	});

	it("should find grid surface", () => {
		const surface = getDrenyraProductSurface("grid");
		expect(surface).toBeDefined();
		expect(surface!.status).toBe("separate-runtime");
	});
});
