import { describe, expect, it } from "vitest";
import { consumeSseBuffer } from "../cognitive-stream";

describe("consumeSseBuffer", () => {
	it("parses complete SSE events and returns trailing rest", () => {
		const input = [
			"event: token",
			'data: {"type":"token","content":"Ho"}',
			"",
			"event: token",
			'data: {"type":"token","content":"la"}',
			"",
			"event: done",
			'data: {"type":"done","finish_reason":"stop"}',
			"",
			"",
		].join("\n");

		const parsed = consumeSseBuffer(input);

		expect(parsed.events).toHaveLength(3);
		expect(parsed.events[0]?.event).toBe("token");
		expect(parsed.events[0]?.data).toContain('"content":"Ho"');
		expect(parsed.rest).toBe("");
	});

	it("keeps incomplete block as rest", () => {
		const input = 'event: token\ndata: {"type":"token","content":"parcial"}';
		const parsed = consumeSseBuffer(input);

		expect(parsed.events).toHaveLength(0);
		expect(parsed.rest).toBe(input);
	});
});
