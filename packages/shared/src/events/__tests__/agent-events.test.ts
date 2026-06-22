import { describe, expect, it } from "vitest";

import {
	type AgentEvent,
	type AgentEventType,
	type ApprovalDecisionEvent,
	type ApprovalRequiredEvent,
	type CompleteEvent,
	type ErrorEvent,
	type ProgressEvent,
	type RunStartedEvent,
	type ThinkingEvent,
	type ToolCallEvent,
	type ToolErrorEvent,
	type ToolResultEvent,
	type UsageEvent,
	deserializeEvent,
	isAgentEvent,
	serializeEvent,
} from "../index";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeBase(overrides?: Partial<AgentEvent>): Record<string, unknown> {
	return {
		id: "evt-001",
		runId: "run-abc",
		timestamp: 1_700_000_000_000,
		...overrides,
	};
}

// ─── Event Construction ──────────────────────────────────────────────────────

describe("AgentEvent variants", () => {
	it("constructs RunStartedEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "run_started",
			payload: { runId: "run-abc", startedAt: 1_700_000_000_000 },
		} satisfies RunStartedEvent;

		expect(event.type).toBe("run_started");
		expect(event.payload.runId).toBe("run-abc");
	});

	it("constructs ThinkingEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "thinking",
			payload: { content: "Analyzing invoice...", agentId: "agent-1" },
		} satisfies ThinkingEvent;

		expect(event.type).toBe("thinking");
		expect(event.payload.content).toBe("Analyzing invoice...");
	});

	it("constructs ToolCallEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "tool_call",
			payload: {
				toolName: "extract_invoice",
				args: { docId: "doc-123" },
				callId: "call-001",
			},
		} satisfies ToolCallEvent;

		expect(event.type).toBe("tool_call");
		expect(event.payload.toolName).toBe("extract_invoice");
	});

	it("constructs ToolResultEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "tool_result",
			payload: {
				toolName: "extract_invoice",
				callId: "call-001",
				result: { status: "ok" },
				duration: 150,
			},
		} satisfies ToolResultEvent;

		expect(event.type).toBe("tool_result");
		expect(event.payload.duration).toBe(150);
	});

	it("constructs ToolErrorEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "tool_error",
			payload: {
				toolName: "extract_invoice",
				callId: "call-001",
				error: "Timeout exceeded",
			},
		} satisfies ToolErrorEvent;

		expect(event.type).toBe("tool_error");
		expect(event.payload.error).toBe("Timeout exceeded");
	});

	it("constructs ProgressEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "progress",
			payload: { progress: 42, status: "Processing", detail: "Step 3 of 7" },
		} satisfies ProgressEvent;

		expect(event.type).toBe("progress");
		expect(event.payload.progress).toBe(42);
	});

	it("constructs ApprovalRequiredEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "approval_required",
			payload: {
				approvalId: "aprv-001",
				toolName: "submit_to_sunat",
				args: { invoiceId: "inv-456" },
				risk: "high",
				reason: "Invoice exceeds S/10,000",
			},
		} satisfies ApprovalRequiredEvent;

		expect(event.type).toBe("approval_required");
		expect(event.payload.risk).toBe("high");
	});

	it("constructs ApprovalDecisionEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "approval_decision",
			payload: {
				approvalId: "aprv-001",
				decision: "approved",
				reason: "Looks correct",
			},
		} satisfies ApprovalDecisionEvent;

		expect(event.type).toBe("approval_decision");
		expect(event.payload.decision).toBe("approved");
	});

	it("constructs UsageEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "usage",
			payload: {
				promptTokens: 500,
				completionTokens: 200,
				totalTokens: 700,
				modelId: "gpt-4",
			},
		} satisfies UsageEvent;

		expect(event.type).toBe("usage");
		expect(event.payload.totalTokens).toBe(700);
	});

	it("constructs CompleteEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "complete",
			payload: { result: "done", duration: 5000, toolCalls: 3 },
		} satisfies CompleteEvent;

		expect(event.type).toBe("complete");
		expect(event.payload.toolCalls).toBe(3);
	});

	it("constructs ErrorEvent with correct type", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "error",
			payload: {
				code: "SUNAT_TIMEOUT",
				message: "Connection to SUNAT OSE timed out",
				details: { retryCount: 3 },
			},
		} satisfies ErrorEvent;

		expect(event.type).toBe("error");
		expect(event.payload.code).toBe("SUNAT_TIMEOUT");
	});
});

// ─── Discriminated Union Narrowing ──────────────────────────────────────────

describe("discriminated union narrowing", () => {
	it("narrows by type discriminant in switch", () => {
		const events: AgentEvent[] = [
			{
				...makeBase(),
				type: "run_started",
				payload: { runId: "run-abc", startedAt: Date.now() },
			},
			{
				...makeBase({ id: "evt-002" }),
				type: "complete",
				payload: { result: "ok", duration: 1000, toolCalls: 2 },
			},
		];

		const types: AgentEventType[] = [];

		for (const event of events) {
			switch (event.type) {
				case "run_started": {
					types.push("run_started");
					// Accessing payload specific to run_started — narrowing works
					expect(event.payload.runId).toBeDefined();
					break;
				}
				case "complete": {
					types.push("complete");
					expect(event.payload.duration).toBeGreaterThan(0);
					break;
				}
				default: {
					types.push(event.type);
				}
			}
		}

		expect(types).toEqual(["run_started", "complete"]);
	});

	it("narrows in if conditions with type guards", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "tool_call",
			payload: {
				toolName: "validate_ruc",
				args: { ruc: "20123456789" },
				callId: "call-002",
			},
		};

		if (event.type === "tool_call") {
			expect(event.payload.toolName).toBe("validate_ruc");
			// @ts-expect-error — should not compile with wrong payload access
			event satisfies ToolCallEvent;
		}
	});

	it("produces the correct AgentEventType union", () => {
		const type1: AgentEventType = "run_started";
		const type2: AgentEventType = "error";
		const type3: AgentEventType = "thinking";

		expect(type1).toBe("run_started");
		expect(type2).toBe("error");
		expect(type3).toBe("thinking");
	});
});

// ─── SSE Serialization ──────────────────────────────────────────────────────

describe("serializeEvent", () => {
	it("produces correct SSE format for run_started", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "run_started",
			payload: { runId: "run-abc", startedAt: 1_700_000_000_000 },
		};

		const sse = serializeEvent(event);
		const lines = sse.split("\n");

		expect(lines[0]).toBe("event: run_started");
		expect(lines[1]).toMatch(/^data: /);
		expect(lines[2]).toBe(""); // trailing blank line
	});

	it("produces valid JSON in the data field", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "thinking",
			payload: { content: "hello", agentId: "a1" },
		};

		const sse = serializeEvent(event);
		const dataLine = sse.split("\n")[1];
		const dataStr = dataLine.slice("data: ".length);
		const parsed = JSON.parse(dataStr);

		expect(parsed.type).toBe("thinking");
		expect(parsed.payload.content).toBe("hello");
	});
});

// ─── SSE Deserialization ────────────────────────────────────────────────────

describe("deserializeEvent", () => {
	it("parses SSE string back to typed event", () => {
		const original: AgentEvent = {
			...makeBase(),
			type: "progress",
			payload: { progress: 50, status: "Halfway", detail: "Step 2" },
		};

		const sse = serializeEvent(original);
		const parsed = deserializeEvent(sse);

		expect(parsed).not.toBeNull();
		expect(parsed!.type).toBe("progress");
		expect(parsed!.payload.progress).toBe(50);
	});

	it("returns null for empty string", () => {
		expect(deserializeEvent("")).toBeNull();
	});

	it("returns null for string with missing event line", () => {
		expect(deserializeEvent('data: {"id":"1"}\n\n')).toBeNull();
	});

	it("returns null for string with missing data line", () => {
		expect(deserializeEvent("event: thinking\n\n")).toBeNull();
	});

	it("returns null for malformed JSON", () => {
		expect(deserializeEvent("event: thinking\ndata: not-json\n\n")).toBeNull();
	});

	it("returns null for unknown event type", () => {
		expect(
			deserializeEvent('event: unknown_event\ndata: {"type":"unknown_event"}\n\n'),
		).toBeNull();
	});

	it("returns null for incomplete base fields", () => {
		expect(
			deserializeEvent(
				'event: thinking\ndata: {"type":"thinking","payload":{}}\n\n',
			),
		).toBeNull();
	});

	it("handles extra whitespace gracefully", () => {
		const sse = "event: complete\ndata: {\"type\":\"complete\"}\n\n";
		// Should still attempt to parse but fail validation
		expect(deserializeEvent(sse)).toBeNull();
	});
});

// ─── Roundtrip ───────────────────────────────────────────────────────────────

describe("serialize → deserialize roundtrip", () => {
	const events: AgentEvent[] = [
		{
			...makeBase(),
			type: "run_started",
			payload: { runId: "run-abc", startedAt: 1_700_000_000_000 },
		},
		{
			...makeBase({ id: "evt-002" }),
			type: "thinking",
			payload: { content: "Thinking...", agentId: "agent-1" },
		},
		{
			...makeBase({ id: "evt-003" }),
			type: "tool_call",
			payload: {
				toolName: "get_ruc",
				args: { ruc: "20123456789" },
				callId: "call-001",
			},
		},
		{
			...makeBase({ id: "evt-004" }),
			type: "tool_result",
			payload: {
				toolName: "get_ruc",
				callId: "call-001",
				result: { name: "ARKELYTHEX SAC" },
				duration: 200,
			},
		},
		{
			...makeBase({ id: "evt-005" }),
			type: "tool_error",
			payload: {
				toolName: "submit_ose",
				callId: "call-002",
				error: "Connection refused",
			},
		},
		{
			...makeBase({ id: "evt-006" }),
			type: "progress",
			payload: { progress: 75, status: "Processing", detail: "Step 5" },
		},
		{
			...makeBase({ id: "evt-007" }),
			type: "approval_required",
			payload: {
				approvalId: "aprv-001",
				toolName: "submit",
				args: { amount: 15000 },
				risk: "high",
				reason: "Exceeds threshold",
			},
		},
		{
			...makeBase({ id: "evt-008" }),
			type: "approval_decision",
			payload: {
				approvalId: "aprv-001",
				decision: "denied",
				reason: "Amount too high",
			},
		},
		{
			...makeBase({ id: "evt-009" }),
			type: "usage",
			payload: {
				promptTokens: 100,
				completionTokens: 50,
				totalTokens: 150,
				modelId: "claude-3",
			},
		},
		{
			...makeBase({ id: "evt-010" }),
			type: "complete",
			payload: { result: "success", duration: 3000, toolCalls: 5 },
		},
		{
			...makeBase({ id: "evt-011" }),
			type: "error",
			payload: {
				code: "AUTH_FAILED",
				message: "Invalid API key",
				details: { keyPrefix: "sk-..." },
			},
		},
	];

	it.each(events)("roundtrips $type", (event) => {
		const sse = serializeEvent(event);
		const parsed = deserializeEvent(sse);

		expect(parsed).not.toBeNull();
		expect(parsed!.type).toBe(event.type);
		expect(parsed!.id).toBe(event.id);
		expect(parsed!.runId).toBe(event.runId);
		expect(parsed!.timestamp).toBe(event.timestamp);
		// Deep comparison of payload
		expect(JSON.stringify(parsed!.payload)).toBe(JSON.stringify(event.payload));
	});
});

// ─── Type Guard ──────────────────────────────────────────────────────────────

describe("isAgentEvent", () => {
	it("returns true for a valid AgentEvent", () => {
		const event: AgentEvent = {
			...makeBase(),
			type: "usage",
			payload: {
				promptTokens: 10,
				completionTokens: 20,
				totalTokens: 30,
				modelId: "gpt-4",
			},
		};

		expect(isAgentEvent(event)).toBe(true);
	});

	it("returns false for null", () => {
		expect(isAgentEvent(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isAgentEvent(undefined)).toBe(false);
	});

	it("returns false for a string", () => {
		expect(isAgentEvent("hello")).toBe(false);
	});

	it("returns false for a number", () => {
		expect(isAgentEvent(42)).toBe(false);
	});

	it("returns false for an array", () => {
		expect(isAgentEvent([])).toBe(false);
	});

	it("returns false for object missing id field", () => {
		expect(isAgentEvent({ runId: "r1", timestamp: 1, type: "error" })).toBe(
			false,
		);
	});

	it("returns false for object with unknown type", () => {
		expect(
			isAgentEvent({
				id: "e1",
				runId: "r1",
				timestamp: 1,
				type: "bogus_type",
				payload: {},
			}),
		).toBe(false);
	});

	it("returns false for object with null payload", () => {
		expect(
			isAgentEvent({
				id: "e1",
				runId: "r1",
				timestamp: 1,
				type: "thinking",
				payload: null,
			}),
		).toBe(false);
	});

	it("narrows type when used in condition", () => {
		const data: unknown = {
			...makeBase(),
			type: "progress" as const,
			payload: { progress: 100, status: "Done" },
		};

		if (isAgentEvent(data)) {
			// Inside this block, data is narrowed to AgentEvent
			expect(data.type).toBe("progress");
			expect(data.payload.progress).toBe(100);
		}
	});
});
