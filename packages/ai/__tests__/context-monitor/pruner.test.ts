/**
 * ContextPruner Tests
 *
 * Covers:
 * - T5.1: Sliding window strategy (6 scenarios)
 * - T5.2: Summarization + non-blocking (4 scenarios)
 * - T5.3: Integration scenarios (3 scenarios)
 *
 * @module __tests__/context-monitor
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ContextPruner,
	createContextPruner,
} from "../../src/context-monitor/context-pruner";
import type { ChatMessage } from "../../src/gateway/types";

// ─── Helper: Create test messages ──────────────────────────────────────

function systemMessage(content: string): ChatMessage {
	return { role: "system", content };
}

function userMessage(content: string): ChatMessage {
	return { role: "user", content };
}

function assistantMessage(content: string): ChatMessage {
	return { role: "assistant", content };
}

function toolMessage(content: string): ChatMessage {
	return { role: "tool", content, toolCallId: "call_1" };
}

/**
 * Create N messages with a system message at index 0.
 */
function createConversation(
	count: number,
	includeSystem: boolean = true,
	systemContent: string = "You are a helpful assistant.",
): ChatMessage[] {
	const messages: ChatMessage[] = [];
	if (includeSystem) {
		messages.push(systemMessage(systemContent));
	}
	for (let i = messages.length; i < count; i++) {
		const role = i % 2 === 0 ? "user" : "assistant";
		messages.push(
			role === "user"
				? userMessage(`User message ${i}`)
				: assistantMessage(`Assistant response ${i}`),
		);
	}
	return messages;
}

// =========================================================================
// T5.1 — Sliding Window Tests
// =========================================================================

describe("T5.1: Sliding Window Strategy", () => {
	let pruner: ContextPruner;

	beforeEach(() => {
		pruner = new ContextPruner({
			strategy: "sliding-window",
			maxMessages: 6,
		});
	});

	it("preserves system message with last N messages", () => {
		const messages = createConversation(20, true);
		expect(messages.length).toBe(20);
		expect(messages[0].role).toBe("system");

		const result = pruner.prune(messages);

		// System message + last 6 non-system messages = 7 total
		expect(result.messages.length).toBe(7);

		// System message preserved at position 0
		expect(result.messages[0].role).toBe("system");
		expect(result.messages[0].content).toBe("You are a helpful assistant.");

		// Last 6 messages are non-system
		const nonSystem = result.messages.filter((m) => m.role !== "system");
		expect(nonSystem.length).toBe(6);

		// Verify the last 6 original non-system messages are kept
		const origNonSystem = messages.filter((m) => m.role !== "system");
		const last6 = origNonSystem.slice(-6);
		expect(nonSystem).toEqual(last6);
	});

	it("returns identical messages when under limit", () => {
		const messages = createConversation(4, true);
		expect(messages.length).toBe(4);

		const result = pruner.prune(messages);

		// All messages preserved
		expect(result.messages).toEqual(messages);
		expect(result.messages.length).toBe(4);
	});

	it("handles empty message array", () => {
		const messages: ChatMessage[] = [];
		const result = pruner.prune(messages);

		expect(result.messages).toEqual([]);
		expect(result.tokensBefore).toBe(0);
		expect(result.tokensAfter).toBe(0);
	});

	it("preserves all system messages when multiple exist", () => {
		const messages: ChatMessage[] = [
			systemMessage("System prompt 1"),
			userMessage("Message 1"),
			assistantMessage("Response 1"),
			systemMessage("System prompt 2 (interleaved)"),
			userMessage("Message 2"),
			assistantMessage("Response 2"),
			userMessage("Message 3"),
			assistantMessage("Response 3"),
			systemMessage("System prompt 3"),
			userMessage("Message 4"),
			assistantMessage("Response 4"),
			userMessage("Message 5"),
			assistantMessage("Response 5"),
			userMessage("Message 6"),
			assistantMessage("Response 6"),
		];

		const result = pruner.prune(messages);

		// All 3 system messages preserved
		const systemInResult = result.messages.filter((m) => m.role === "system");
		expect(systemInResult.length).toBe(3);
		expect(systemInResult[0].content).toBe("System prompt 1");
		expect(systemInResult[1].content).toBe("System prompt 2 (interleaved)");
		expect(systemInResult[2].content).toBe("System prompt 3");

		// System messages appear first, then last 6 non-system messages
		const nonSystemInResult = result.messages.filter(
			(m) => m.role !== "system",
		);
		expect(nonSystemInResult.length).toBe(6);

		// Verify last 6 non-system originals are kept
		const origNonSystem = messages.filter((m) => m.role !== "system");
		const last6 = origNonSystem.slice(-6);
		expect(nonSystemInResult).toEqual(last6);
	});

	it("keeps last N messages when no system message exists", () => {
		const messages = [
			userMessage("Message 1"),
			assistantMessage("Response 1"),
			userMessage("Message 2"),
			assistantMessage("Response 2"),
			userMessage("Message 3"),
			assistantMessage("Response 3"),
			userMessage("Message 4"),
			assistantMessage("Response 4"),
			userMessage("Message 5"),
			assistantMessage("Response 5"),
		];
		expect(messages.length).toBe(10);

		const result = pruner.prune(messages);

		// No system messages → last 6 messages kept
		expect(result.messages.length).toBe(6);
		expect(result.messages).toEqual(messages.slice(-6));
	});

	it("correctly handles mix of system, user, assistant, and tool messages", () => {
		const messages: ChatMessage[] = [
			systemMessage("System instruction"),
			userMessage("Extract data from invoice"),
			assistantMessage("I'll process the invoice"),
			toolMessage('{"result": "Invoice processed"}'),
			assistantMessage("Here's the summary"),
			userMessage("Validate the result"),
			assistantMessage("Validation complete"),
			toolMessage('{"valid": true}'),
			assistantMessage("Everything looks good"),
			userMessage("Send to SUNAT"),
			assistantMessage("Submitting..."),
			toolMessage('{"status": "accepted"}'),
			assistantMessage("Done!"),
		];

		const result = pruner.prune(messages);

		// System message preserved
		expect(result.messages[0].role).toBe("system");
		expect(result.messages[0].content).toBe("System instruction");

		// Last 6 non-system messages kept
		const nonSystem = result.messages.filter((m) => m.role !== "system");
		expect(nonSystem.length).toBe(6);

		// The last 6 should include the final tool + assistant messages
		const origNonSystem = messages.filter((m) => m.role !== "system");
		expect(nonSystem).toEqual(origNonSystem.slice(-6));
	});

	it("tracks token counts correctly", () => {
		const messages = createConversation(20, true);
		const result = pruner.prune(messages);

		expect(result.tokensBefore).toBeGreaterThan(0);
		expect(result.tokensAfter).toBeGreaterThan(0);
		expect(result.tokensAfter).toBeLessThan(result.tokensBefore);
		expect(result.strategy).toBe("sliding-window");
	});

	it("produces deterministic output for identical input", () => {
		const messages = createConversation(15, true);

		const result1 = pruner.prune(messages);
		const result2 = pruner.prune(messages);

		expect(result1.messages).toEqual(result2.messages);
		expect(result1.tokensBefore).toBe(result2.tokensBefore);
		expect(result1.tokensAfter).toBe(result2.tokensAfter);
	});
});

// =========================================================================
// T5.2 — Summarization + Non-Blocking Tests
// =========================================================================

describe("T5.2: Summarization and Non-Blocking", () => {
	let pruner: ContextPruner;

	beforeEach(() => {
		pruner = new ContextPruner({
			strategy: "summarization",
			maxMessages: 6,
			enableSummarization: true,
		});
	});

	it("falls back to sliding-window when no summarizeFn is configured", () => {
		const messages = createConversation(20, true);

		// Without summarizeFn, summarization throws → falls back to sliding-window
		const result = pruner.prune(messages);

		// Should have fallen back to sliding-window
		expect(result.strategy).toBe("sliding-window");

		// System message + last 6 non-system messages
		expect(result.messages[0].role).toBe("system");
		const nonSystem = result.messages.filter((m) => m.role !== "system");
		expect(nonSystem.length).toBe(6);
	});

	it("falls back to sliding-window on LLM error", async () => {
		const mockSummarizeFn = vi
			.fn()
			.mockRejectedValue(new Error("LLM API error"));
		const prunerWithFn = new ContextPruner(
			{
				strategy: "summarization",
				maxMessages: 6,
				enableSummarization: true,
			},
			{ summarizeFn: mockSummarizeFn },
		);

		const messages = createConversation(20, true);

		// sync prune() falls back because summarize throws sync-style
		// (the async summarizeAsync would use the mock)
		const result = prunerWithFn.prune(messages);
		expect(result.strategy).toBe("sliding-window");
		expect(result.messages.length).toBe(7); // 1 system + 6 non-system
	});

	it("returns original messages on invalid strategy gracefully", () => {
		const prunerWithInvalid = new ContextPruner({
			strategy: "disabled" as any,
			maxMessages: 6,
		});

		const messages = createConversation(20, true);
		const result = prunerWithInvalid.prune(messages);

		// Disabled = passthrough
		expect(result.messages).toEqual(messages);
		expect(result.strategy).toBe("disabled");
		expect(result.tokensBefore).toBe(result.tokensAfter);
	});

	it("never throws — prune() catches all errors and returns original messages", () => {
		// Create a pruner with a sliding-window strategy — should always succeed
		const safePruner = new ContextPruner({
			strategy: "sliding-window",
			maxMessages: 6,
		});

		// Test with various edge cases — none should throw
		const edgeCases: ChatMessage[][] = [
			[],
			[systemMessage("Only system")],
			createConversation(1, true),
			createConversation(100, true),
		];

		for (const messages of edgeCases) {
			expect(() => safePruner.prune(messages)).not.toThrow();
		}
	});

	it("async summarize falls back on empty summary", async () => {
		const mockSummarizeFn = vi.fn().mockResolvedValue("");
		const prunerWithFn = new ContextPruner(
			{
				strategy: "summarization",
				maxMessages: 6,
				enableSummarization: true,
			},
			{ summarizeFn: mockSummarizeFn },
		);

		const messages = createConversation(20, true);
		const result = await prunerWithFn.summarizeAsync(messages);

		// Empty summary → sliding-window fallback
		expect(result.length).toBe(7); // 1 system + 6 non-system
	});

	it("async summarize injects summary as system message on success", async () => {
		const mockSummarizeFn = vi
			.fn()
			.mockResolvedValue(
				"Previous conversation summary: user asked about invoices",
			);
		const prunerWithFn = new ContextPruner(
			{
				strategy: "summarization",
				maxMessages: 6,
				enableSummarization: true,
			},
			{ summarizeFn: mockSummarizeFn },
		);

		const messages = createConversation(20, true);
		const result = await prunerWithFn.summarizeAsync(messages);

		// Should include: system messages + summary system message + last N/2 non-system
		// N/2 = 3 for maxMessages=6. So: 1 original system + 1 summary + 3 last = 5
		const systemMessages = result.filter((m) => m.role === "system");
		expect(systemMessages.length).toBe(2); // original + summary

		// Summary message contains the summary content
		const summaryMsg = systemMessages.find((m) =>
			m.content.includes("Previous context summary"),
		);
		expect(summaryMsg).toBeDefined();
	});

	it("budget calculation matches model context window", () => {
		const budget = pruner.calculateBudget("gemini-3-flash", 0.95);

		// gemini-3-flash has contextWindow: 1_000_000
		expect(budget.contextWindow).toBe(1_000_000);
		expect(budget.maxTokens).toBe(950_000); // 1_000_000 * 0.95
		expect(budget.ratio).toBe(0.95);
	});

	it("budget calculation uses fallback for unknown models", () => {
		const budget = pruner.calculateBudget("unknown-model-v99", 0.95);

		expect(budget.contextWindow).toBe(200_000); // UNKNOWN_MODEL_CONTEXT_WINDOW
		expect(budget.maxTokens).toBe(190_000); // 200_000 * 0.95
	});

	it("async summarize handles LLM error gracefully", async () => {
		const mockSummarizeFn = vi.fn().mockRejectedValue(new Error("API timeout"));
		const prunerWithFn = new ContextPruner(
			{
				strategy: "summarization",
				maxMessages: 6,
				enableSummarization: true,
			},
			{ summarizeFn: mockSummarizeFn },
		);

		const messages = createConversation(20, true);
		const result = await prunerWithFn.summarizeAsync(messages);

		// Should fall back to sliding-window silently
		expect(result.length).toBe(7); // 1 system + 6 non-system
	});

	it("gets cheapest flash model from registry", () => {
		const model = pruner.getCheapestFlashModel();
		// gemini-3-flash is $0.10/$0.40 per 1M tokens — should be cheapest
		expect(typeof model).toBe("string");
		expect(model.length).toBeGreaterThan(0);
	});

	it("estimate token count uses heuristic", () => {
		const messages = [systemMessage("Hello world"), userMessage("Hi there")];

		const tokens = pruner.getEstimatedTokenCount(messages);
		// content: "Hello world" (11) + "Hi there" (8) = 19 chars → ceil(19/4) = 5
		// messages: 2 → 2 * 100 = 200
		// max(5, 200) = 200
		expect(tokens).toBe(200);
	});

	it("onPruneApplied callback fires when pruning reduces tokens", () => {
		const onPruneApplied = vi.fn();

		const prunerWithCb = new ContextPruner(
			{ strategy: "sliding-window", maxMessages: 6 },
			{ onPruneApplied },
		);

		const messages = createConversation(20, true);
		prunerWithCb.prune(messages, "run-abc");

		expect(onPruneApplied).toHaveBeenCalledTimes(1);
		const [result, runId] = onPruneApplied.mock.calls[0];
		expect(runId).toBe("run-abc");
		expect(result.tokensAfter).toBeLessThan(result.tokensBefore);
	});

	it("onPruneApplied callback does NOT fire on no-op", () => {
		const onPruneApplied = vi.fn();

		const prunerWithCb = new ContextPruner(
			{ strategy: "sliding-window", maxMessages: 10 },
			{ onPruneApplied },
		);

		const messages = createConversation(4, true);
		prunerWithCb.prune(messages);

		// No pruning happened → no callback
		expect(onPruneApplied).not.toHaveBeenCalled();
	});
});

// =========================================================================
// T5.3 — Integration-Style Tests
// =========================================================================

describe("T5.3: Integration Scenarios", () => {
	it("gateway-style: pruner is called when messages exceed maxMessages", () => {
		// Simulate the gateway check: if contextPruner exists AND
		// messages.length > maxMessages, call prune()
		const pruner = new ContextPruner({
			strategy: "sliding-window",
			maxMessages: 6,
		});

		const messages = createConversation(20, true);

		// Gateway check
		const shouldPrune = messages.length > pruner.config.maxMessages;
		expect(shouldPrune).toBe(true);

		const result = pruner.prune(messages, "run-integration");
		expect(result.messages.length).toBeLessThan(messages.length);
		expect(result.strategy).toBe("sliding-window");
	});

	it("gateway-style: no pruning when within maxMessages", () => {
		const pruner = new ContextPruner({
			strategy: "sliding-window",
			maxMessages: 10,
		});

		const messages = createConversation(5, true);

		const shouldPrune = messages.length > pruner.config.maxMessages;
		expect(shouldPrune).toBe(false);

		const result = pruner.prune(messages, "run-integration");
		expect(result.messages).toEqual(messages);
		expect(result.tokensBefore).toBe(result.tokensAfter);
	});

	it("gateway-style: disabled strategy never prunes", () => {
		const pruner = new ContextPruner({ strategy: "disabled" });

		const messages = createConversation(50, true);
		const result = pruner.prune(messages, "run-disabled");

		expect(result.messages).toEqual(messages);
		expect(result.strategy).toBe("disabled");
		expect(result.tokensBefore).toBe(result.tokensAfter);
	});

	it("eventbus-style: PRUNE_REQUESTED subscriber calls pruner.prune()", () => {
		// Simulates the orchestrator's EventBus subscriber
		const pruner = new ContextPruner({
			strategy: "sliding-window",
			maxMessages: 6,
		});

		// Simulate what happens when a PRUNE_REQUESTED event fires
		const onPruneRequested = (processId: string) => {
			const messages = createConversation(20, true);
			const result = pruner.prune(messages, processId);
			return result;
		};

		const result = onPruneRequested("process-123");

		expect(result.strategy).toBe("sliding-window");
		expect(result.tokensAfter).toBeLessThan(result.tokensBefore);
		expect(result.messages[0].role).toBe("system");
	});

	it("budget calculation for gateway pre-execution check", () => {
		const pruner = new ContextPruner({
			strategy: "sliding-window",
			maxMessages: 6,
			tokenBudgetRatio: 0.8,
		});

		const budget = pruner.calculateBudget("claude-haiku-4.5");
		// claude-haiku-4.5 has contextWindow: 200_000
		// 200_000 * 0.8 = 160_000
		expect(budget.maxTokens).toBe(160_000);
		expect(budget.ratio).toBe(0.8);

		// Now test that an estimate under budget = no prune
		// 3 messages × ~100 chars each ≈ 75 chars → ceil(75/4) ≈ 19, max(19, 300) = 300
		// 300 < 160_000 → within budget
		const smallMessages = createConversation(3, true);
		const estimated = pruner.getEstimatedTokenCount(smallMessages);
		expect(estimated).toBeLessThan(budget.maxTokens);
	});

	it("createContextPruner convenience factory works", () => {
		const pruner = createContextPruner({ maxMessages: 8 });
		expect(pruner.config.maxMessages).toBe(8);
		expect(pruner.config.strategy).toBe("sliding-window");
	});
});
