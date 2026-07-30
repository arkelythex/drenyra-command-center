import { describe, it, expect } from "vitest";
import { createExecutionId } from "@drenyra/workspace-domain";
import {
	createCheckpoint,
	shouldCreateCheckpoint,
} from "../checkpoint/manager";
import type { Checkpoint } from "../projections/types";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("createCheckpoint", () => {
	it("should create a checkpoint with correct fields", () => {
		const projectionId = "proj-1";
		const executionId = createExecutionId();
		const sequence = 42;
		const state = { lifecycle: "running" };

		const checkpoint = createCheckpoint(
			projectionId,
			executionId,
			sequence,
			state,
		);

		expect(checkpoint.projectionId).toBe(projectionId);
		expect(checkpoint.executionId).toBe(executionId);
		expect(checkpoint.sequence).toBe(sequence);
		expect(checkpoint.state).toEqual(state);
		expect(checkpoint.schemaVersion).toBeGreaterThan(0);
		expect(checkpoint.timestamp).toBeTruthy();
	});
});

describe("shouldCreateCheckpoint", () => {
	it("should create on first event (no previous checkpoint)", () => {
		expect(shouldCreateCheckpoint(null, 1, 100)).toBe(true);
	});

	it("should not create when within interval", () => {
		const lastCheckpoint: Checkpoint = {
			projectionId: "proj-1",
			executionId: createExecutionId(),
			sequence: 50,
			state: {},
			timestamp: "2026-07-15T10:00:00.000Z",
			schemaVersion: 1,
		};

		expect(shouldCreateCheckpoint(lastCheckpoint, 99, 100)).toBe(false);
	});

	it("should create when past interval", () => {
		const lastCheckpoint: Checkpoint = {
			projectionId: "proj-1",
			executionId: createExecutionId(),
			sequence: 50,
			state: {},
			timestamp: "2026-07-15T10:00:00.000Z",
			schemaVersion: 1,
		};

		expect(shouldCreateCheckpoint(lastCheckpoint, 151, 100)).toBe(true);
	});

	it("should create when exactly at interval boundary", () => {
		const lastCheckpoint: Checkpoint = {
			projectionId: "proj-1",
			executionId: createExecutionId(),
			sequence: 0,
			state: {},
			timestamp: "2026-07-15T10:00:00.000Z",
			schemaVersion: 1,
		};

		expect(shouldCreateCheckpoint(lastCheckpoint, 100, 100)).toBe(true);
	});
});
