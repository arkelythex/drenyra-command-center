import { afterEach, describe, expect, it, vi } from "vitest";
import { AskError, type AskEvent, streamAsk } from "../ask-client";
import { parseSse } from "../sse";

describe("parseSse", () => {
	it("parses complete events and keeps a partial one for the next chunk", () => {
		const first = parseSse(
			'event: token\ndata: {"content":"Ho"}\n\nevent: tok',
		);
		expect(first.events).toEqual([{ event: "token", data: { content: "Ho" } }]);

		const second = parseSse(`${first.rest}en\ndata: {"content":"la"}\n\n`);
		expect(second.events).toEqual([
			{ event: "token", data: { content: "la" } },
		]);
		expect(second.rest).toBe("");
	});

	it("ignores events whose data is not JSON", () => {
		expect(parseSse("event: token\ndata: not-json\n\n").events).toEqual([]);
	});
});

function sseResponse(chunks: string[], status = 200) {
	const encoder = new TextEncoder();
	const body = new ReadableStream({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
			controller.close();
		},
	});
	return new Response(body, {
		status,
		headers: { "Content-Type": "text/event-stream" },
	});
}

async function collect(stream: AsyncIterable<AskEvent>) {
	const events: AskEvent[] = [];
	for await (const event of stream) events.push(event);
	return events;
}

afterEach(() => vi.unstubAllGlobals());

describe("streamAsk", () => {
	it("posts the question for the active company with the session cookie and yields tokens", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				sseResponse([
					'event: run_started\ndata: {"runId":"r1"}\n\n',
					'event: token\ndata: {"content":"El IGV "}\n\nevent: token\ndata: {"content":"vence"}\n\n',
					'event: done\ndata: {"finish_reason":"stop"}\n\n',
				]),
			);
		vi.stubGlobal("fetch", fetchMock);

		const events = await collect(
			streamAsk({ companyId: "cmp-1", question: "¿Cuándo vence el IGV?" }),
		);

		expect(events).toEqual([
			{ type: "token", text: "El IGV " },
			{ type: "token", text: "vence" },
			{ type: "done" },
		]);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toMatch(/\/api\/ai-swarm\/cognitive-stream$/);
		expect(init.credentials).toBe("include");
		expect(JSON.parse(init.body as string)).toEqual({
			companyId: "cmp-1",
			messages: [{ role: "user", content: "¿Cuándo vence el IGV?" }],
			modelTier: "fast",
			tools: false,
		});
	});

	it("turns an error event into a thrown AskError", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					sseResponse(['event: error\ndata: {"message":"upstream down"}\n\n']),
				),
		);
		await expect(
			collect(streamAsk({ companyId: "cmp-1", question: "x" })),
		).rejects.toMatchObject({
			kind: "stream",
		});
	});

	it.each([
		[401, "unauthenticated"],
		[403, "forbidden"],
		[400, "unavailable"],
		[502, "unavailable"],
	] as const)("maps HTTP %i to %s", async (status, kind) => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("{}", { status })),
		);
		const error = await collect(
			streamAsk({ companyId: "cmp-1", question: "x" }),
		).catch((e) => e);
		expect(error).toBeInstanceOf(AskError);
		expect(error.kind).toBe(kind);
	});
});
