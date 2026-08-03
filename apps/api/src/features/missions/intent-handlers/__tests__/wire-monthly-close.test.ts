/**
 * wireMonthlyCloseHandler — unit tests.
 *
 * Verifies the fail-closed gate: the real pipeline stays dormant unless
 * MONTHLY_CLOSE_PIPELINE_ENABLED=true, and only then registers the handler.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTENT_HANDLERS } from "../intent-handlers.registry";
import { MonthlyCloseIntentHandler } from "../monthly-close-intent.handler";
import {
	MONTHLY_CLOSE_PIPELINE_FLAG,
	wireMonthlyCloseHandler,
} from "../wire-monthly-close";

const eventStore = { appendEvent: vi.fn() } as never;

describe("wireMonthlyCloseHandler", () => {
	beforeEach(() => {
		delete process.env[MONTHLY_CLOSE_PIPELINE_FLAG];
		INTENT_HANDLERS.clear();
	});
	afterEach(() => {
		INTENT_HANDLERS.clear();
		delete process.env[MONTHLY_CLOSE_PIPELINE_FLAG];
	});

	it("stays dormant (returns false, nothing registered) when the flag is unset", () => {
		const wired = wireMonthlyCloseHandler({}, eventStore);
		expect(wired).toBe(false);
		expect(INTENT_HANDLERS.has("monthly-close")).toBe(false);
	});

	it("stays dormant when the flag is explicitly false", () => {
		process.env[MONTHLY_CLOSE_PIPELINE_FLAG] = "false";
		expect(wireMonthlyCloseHandler({}, eventStore)).toBe(false);
		expect(INTENT_HANDLERS.has("monthly-close")).toBe(false);
	});

	it("registers the real handler when the flag is true", () => {
		process.env[MONTHLY_CLOSE_PIPELINE_FLAG] = "true";
		const wired = wireMonthlyCloseHandler({}, eventStore);
		expect(wired).toBe(true);
		const handler = INTENT_HANDLERS.get("monthly-close");
		expect(handler).toBeInstanceOf(MonthlyCloseIntentHandler);
	});
});
