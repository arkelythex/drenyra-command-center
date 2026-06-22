import { describe, expect, it, vi } from "vitest";
import {
	appendActivityEntry,
	createActivityEntry,
	mergeRecoveredActivities,
	resolveEventRunId,
} from "../cognitive-stream";

describe("cognitive stream activity helpers", () => {
	it("maps events to timeline entries with correct status", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-19T12:00:00.000Z"));

		const started = createActivityEntry(
			{
				id: "evt_1",
				runId: "run-123",
				timestamp: 1000000,
				type: "run_started",
				payload: {
					runId: "run-123",
					startedAt: 1000000,
				},
			},
			null,
		);
		const approval = createActivityEntry(
			{
				id: "evt_2",
				runId: "run-123",
				timestamp: 1000000,
				type: "approval_required",
				payload: {
					approvalId: "tool-1",
					toolName: "crear_asiento",
					args: { amount: 118 },
					risk: "medium",
					reason: "Approval required",
				},
			},
			"run-123",
		);
		const done = createActivityEntry(
			{
				id: "evt_3",
				runId: "run-123",
				timestamp: 1000000,
				type: "complete",
				payload: {
					result: null,
					duration: 0,
					toolCalls: 0,
				},
			},
			"run-123",
		);

		expect(started?.status).toBe("info");
		expect(approval?.status).toBe("warning");
		expect(done?.label).toBe("Run finalizado");

		vi.useRealTimers();
	});

	it("resolves runId from event when available", () => {
		const fromEvent = resolveEventRunId(
			{
				id: "evt_10",
				runId: "",
				timestamp: 1000000,
				type: "approval_decision",
				payload: {
					approvalId: "tool-1",
					decision: "approved",
				},
			},
			"run-fallback",
		);
		const fallback = resolveEventRunId(
			{
				id: "evt_11",
				runId: "",
				timestamp: 1000000,
				type: "complete",
				payload: {
					result: null,
					duration: 0,
					toolCalls: 0,
				},
			},
			"run-fallback",
		);

		expect(fromEvent).toBe("tool-1");
		expect(fallback).toBe("run-fallback");
	});

	it("enforces bounded timeline length", () => {
		const e1 = createActivityEntry(
			{
				id: "evt_20",
				runId: "run-x",
				timestamp: 1000000,
				type: "tool_call",
				payload: { toolName: "consultar_ruc", args: {}, callId: "tool-1" },
			},
			"run-x",
		);
		const e2 = createActivityEntry(
			{
				id: "evt_21",
				runId: "run-x",
				timestamp: 1000000,
				type: "tool_result",
				payload: { toolName: "consultar_ruc", result: { ok: true }, callId: "", duration: 0 },
			},
			"run-x",
		);

		const afterFirst = appendActivityEntry([], e1, 1);
		const afterSecond = appendActivityEntry(afterFirst, e2, 1);

		expect(afterFirst).toHaveLength(1);
		expect(afterSecond).toHaveLength(1);
		expect(afterSecond[0]?.type).toBe("tool_result");
	});

	it("merges recovered approval records without duplicates", () => {
		const merged = mergeRecoveredActivities(
			[
				{
					id: "persisted-tool-1-approved-2026-02-19T12:01:00.000Z",
					runId: "run-1",
					type: "approval_decision",
					label: "Aprobacion aceptada",
					detail: "crear_asiento",
					status: "success",
					timestamp: "2026-02-19T12:01:00.000Z",
				},
			],
			[
				{
					runId: "run-1",
					toolCallId: "tool-1",
					name: "crear_asiento",
					status: "approved",
					decisionReason: null,
					requestedAt: "2026-02-19T12:00:00.000Z",
					decidedAt: "2026-02-19T12:01:00.000Z",
				},
				{
					runId: "run-1",
					toolCallId: "tool-2",
					name: "consultar_ruc",
					status: "pending",
					decisionReason: null,
					requestedAt: "2026-02-19T12:02:00.000Z",
					decidedAt: null,
				},
			],
		);

		expect(merged).toHaveLength(2);
		expect(merged[0]?.detail).toContain("crear_asiento");
		expect(merged[1]?.label).toBe("Aprobacion pendiente");
	});
});

