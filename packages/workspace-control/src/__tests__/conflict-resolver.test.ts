import { describe, it, expect } from "vitest";
import {
	DefaultConflictResolver,
	detectConflict,
} from "../concurrency/conflict-resolver";
import { CONFLICT_RESOLUTION_STRATEGY } from "../concurrency/types";
import type { ConflictResolver } from "../concurrency/conflict-resolver";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeResolver(): ConflictResolver {
	return new DefaultConflictResolver();
}

// ─── detectConflict ──────────────────────────────────────────────────────────

describe("detectConflict", () => {
	it("should return null when revisions match", () => {
		const result = detectConflict(5, 5);

		expect(result).toBeNull();
	});

	it("should return ConflictEvent when revisions differ", () => {
		const result = detectConflict(3, 5);

		expect(result).not.toBeNull();
		expect(result?.expectedRevision).toBe(3);
		expect(result?.actualRevision).toBe(5);
	});
});

// ─── DefaultConflictResolver ─────────────────────────────────────────────────

describe("DefaultConflictResolver", () => {
	const resolver = makeResolver();

	it("should return server-wins for workspace resource type", () => {
		const strategy = resolver.resolve({
			resourceId: "ws-1",
			resourceType: "workspace",
			expectedRevision: 1,
			actualRevision: 2,
			timestamp: new Date().toISOString(),
		});

		expect(strategy).toBe(CONFLICT_RESOLUTION_STRATEGY.SERVER_WINS);
	});

	it("should return server-wins for layout resource type", () => {
		const strategy = resolver.resolve({
			resourceId: "layout-1",
			resourceType: "layout",
			expectedRevision: 1,
			actualRevision: 2,
			timestamp: new Date().toISOString(),
		});

		expect(strategy).toBe(CONFLICT_RESOLUTION_STRATEGY.SERVER_WINS);
	});

	it("should return notify-only for execution resource type", () => {
		const strategy = resolver.resolve({
			resourceId: "exec-1",
			resourceType: "execution",
			expectedRevision: 1,
			actualRevision: 2,
			timestamp: new Date().toISOString(),
		});

		expect(strategy).toBe(CONFLICT_RESOLUTION_STRATEGY.NOTIFY_ONLY);
	});

	it("should return client-wins for view resource type", () => {
		const strategy = resolver.resolve({
			resourceId: "view-1",
			resourceType: "view",
			expectedRevision: 1,
			actualRevision: 2,
			timestamp: new Date().toISOString(),
		});

		expect(strategy).toBe(CONFLICT_RESOLUTION_STRATEGY.CLIENT_WINS);
	});
});
