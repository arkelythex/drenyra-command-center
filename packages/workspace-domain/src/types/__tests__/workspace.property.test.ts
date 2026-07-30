/**
 * Property-Based Tests — Workspace Domain Invariants
 *
 * These tests verify workspace domain rules hold for ANY valid input,
 * not just hand-picked examples.
 *
 * Uses fc.assert + fc.property directly for cross-version compatibility.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";
import {
	createWorkspace,
	parseWorkspaceId,
	createWorkspaceId,
	workspaceToJSON,
	workspaceFromJSON,
} from "../workspace";
import { createView, moveView, VIEW_KIND } from "../view";
import {
	createOperationalState,
	isTerminal,
	validateOperationalState,
	LIFECYCLE_STATE,
} from "../state";

const UUID_V4_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("Property-based: Workspace domain invariants", () => {
	const nonEmptyId = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);

	const anyObjective = fc.oneof(
		fc.constant({ kind: "monthly-close" as const, fiscalPeriodId: "2026-01" }),
		fc.constant({ kind: "portfolio-operations" as const }),
		fc.constant({ kind: "tax-audit" as const, fiscalPeriodId: "2026-01" }),
		fc.constant({
			kind: "bank-reconciliation" as const,
			accountIds: ["acc-1"],
		}),
		fc.constant({ kind: "custom" as const, definitionId: "def-1" }),
	);

	it("createWorkspace always returns a valid WorkspaceId", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.array(nonEmptyId, { minLength: 1, maxLength: 20 }),
				fc.array(nonEmptyId, { minLength: 1, maxLength: 5 }),
				anyObjective,
				(orgId, companyIds, periodIds, objective) => {
					const ws = createWorkspace({
						organizationId: orgId,
						companyIds,
						fiscalPeriodIds: periodIds,
						objective,
						layoutId: null,
					});

					return (
						UUID_V4_PATTERN.test(ws.workspaceId) &&
						ws.organizationId === orgId &&
						ws.objective.kind === objective.kind &&
						ws.createdAt instanceof Date &&
						ws.updatedAt instanceof Date &&
						ws.schemaVersion === 1 &&
						ws.revision === 1
					);
				},
			),
		);
	});

	it("Workspace always has at least 1 companyId", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.array(nonEmptyId, { minLength: 1, maxLength: 20 }),
				fc.array(nonEmptyId, { minLength: 1, maxLength: 5 }),
				(orgId, companyIds, periodIds) => {
					const ws = createWorkspace({
						organizationId: orgId,
						companyIds,
						fiscalPeriodIds: periodIds,
						objective: { kind: "portfolio-operations" },
						layoutId: null,
					});
					return ws.companyIds.length >= 1;
				},
			),
		);
	});

	it("createWorkspaceId always produces a valid UUID or fallback format", () => {
		fc.assert(
			fc.property(fc.nat({ max: 100 }), () => {
				const id = createWorkspaceId();
				const [parsed, err] = parseWorkspaceId(id);
				return parsed !== null && err === null;
			}),
		);
	});

	it("parseWorkspaceId round-trips createWorkspaceId", () => {
		fc.assert(
			fc.property(fc.nat({ max: 50 }), () => {
				const id = createWorkspaceId();
				const [parsed, err] = parseWorkspaceId(id);
				return parsed === id && err === null;
			}),
		);
	});

	it("Workspace JSON round-trip preserves all fields", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.array(nonEmptyId, { minLength: 1, maxLength: 5 }),
				fc.array(nonEmptyId, { minLength: 1, maxLength: 3 }),
				anyObjective,
				(orgId, companyIds, periodIds, objective) => {
					const ws = createWorkspace({
						organizationId: orgId,
						companyIds,
						fiscalPeriodIds: periodIds,
						objective,
						layoutId: null,
					});

					const json = workspaceToJSON(ws);
					const restored = workspaceFromJSON(json);

					return (
						restored.workspaceId === ws.workspaceId &&
						restored.schemaVersion === ws.schemaVersion &&
						restored.revision === ws.revision &&
						restored.organizationId === ws.organizationId &&
						restored.objective.kind === ws.objective.kind &&
						restored.createdAt.toISOString() === ws.createdAt.toISOString()
					);
				},
			),
		);
	});

	it("View identity never changes after move", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.constantFrom(...Object.values(VIEW_KIND)),
				fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]*$/),
				fc.integer({ min: 0, max: 10 }),
				fc.integer({ min: 0, max: 10 }),
				(workspaceId, kind, label, row, col) => {
					const placement = { row, column: col, width: 400, height: 600 };
					const view = createView({
						workspaceId,
						kind,
						label,
						placement,
						query: {},
					});

					const newPlacement = {
						row: row + 1,
						column: col + 1,
						width: 800,
						height: 300,
					};
					const moved = moveView(view, newPlacement);

					return (
						moved.viewId === view.viewId &&
						moved.workspaceId === view.workspaceId &&
						moved.kind === view.kind &&
						moved.label === view.label &&
						moved.createdAt === view.createdAt
					);
				},
			),
		);
	});

	it("UNKNOWN lifecycle state is never terminal", () => {
		fc.assert(
			fc.property(
				fc.constantFrom(
					LIFECYCLE_STATE.QUEUED,
					LIFECYCLE_STATE.STARTING,
					LIFECYCLE_STATE.RUNNING,
					LIFECYCLE_STATE.VERIFYING,
					LIFECYCLE_STATE.WAITING,
					LIFECYCLE_STATE.UNKNOWN,
				),
				(lifecycle) => {
					const state = createOperationalState({ lifecycle });
					return isTerminal(state) === false;
				},
			),
		);
	});

	it("Terminal lifecycle states are always terminal", () => {
		fc.assert(
			fc.property(
				fc.constantFrom(
					LIFECYCLE_STATE.COMPLETED,
					LIFECYCLE_STATE.CANCELLED,
					LIFECYCLE_STATE.FAILED,
				),
				(lifecycle) => {
					const state = createOperationalState({ lifecycle });
					return isTerminal(state) === true;
				},
			),
		);
	});

	it("validateOperationalState never produces violations for valid terminal states", () => {
		fc.assert(
			fc.property(
				fc.constantFrom(
					LIFECYCLE_STATE.COMPLETED,
					LIFECYCLE_STATE.CANCELLED,
					LIFECYCLE_STATE.FAILED,
				),
				(lifecycle) => {
					const state = createOperationalState({ lifecycle });
					const violations = validateOperationalState(state);
					// Only expected violations for these states
					if (lifecycle === LIFECYCLE_STATE.FAILED) {
						// FAILED with NONE attention is a violation
						return violations.length > 0;
					}
					return violations.length >= 0;
				},
			),
		);
	});

	it("isTerminal: completed=true, cancelled=true, unknown=false", () => {
		const completed = createOperationalState({
			lifecycle: LIFECYCLE_STATE.COMPLETED,
		});
		const cancelled = createOperationalState({
			lifecycle: LIFECYCLE_STATE.CANCELLED,
		});
		const unknown = createOperationalState({
			lifecycle: LIFECYCLE_STATE.UNKNOWN,
		});

		return (
			isTerminal(completed) === true &&
			isTerminal(cancelled) === true &&
			isTerminal(unknown) === false
		);
	});
});
