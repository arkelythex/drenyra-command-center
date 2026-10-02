import { describe, expect, it } from "vitest";
import { LatinModernoOrchestrator } from "../latin-orchestrator";

type Reply = { data: unknown; confidence: number } | Error;

function build(replies: Record<string, Reply>) {
	const orch = new LatinModernoOrchestrator();
	const calls: string[] = [];
	for (const [id, reply] of Object.entries(replies)) {
		orch.registerDomainAgent({
			id,
			receiveTask: async (task: { id: string }) => {
				calls.push(`${id}:${task.id}`);
				if (reply instanceof Error) throw reply;
				return reply;
			},
		} as never);
	}
	return { orch, calls };
}

const ctx = {} as never;

describe("LatinModernoOrchestrator.handleRequest (characterization)", () => {
	it("runs extract -> validate -> classify and merges data from all domains", async () => {
		const { orch, calls } = build({
			scripta: { data: { a: 1 }, confidence: 0.9 },
			regula: { data: { b: 2 }, confidence: 0.9 },
			cerno: { data: { c: 3 }, confidence: 0.9 },
		});
		const result = await orch.handleRequest("procesar factura", ctx);
		expect(calls).toEqual(["scripta:step-1", "regula:step-2", "cerno:step-3"]);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ a: 1, b: 2, c: 3 });
		expect(result.conflicts).toEqual([]);
		expect(result.sessionId).toBeTruthy();
		expect(result.traceId).toBeTruthy();
	});

	it("skips steps whose domain agent is not registered", async () => {
		const { orch, calls } = build({
			scripta: { data: { a: 1 }, confidence: 0.9 },
			regula: { data: { b: 2 }, confidence: 0.9 },
		});
		const result = await orch.handleRequest("extract invoices", ctx);
		expect(calls).toEqual(["scripta:step-1", "regula:step-2"]);
		expect(result.data).toEqual({ a: 1, b: 2 });
	});

	it("turns an agent error into a zero-confidence result and stops the run", async () => {
		const { orch, calls } = build({
			scripta: new Error("boom"),
			regula: { data: { b: 2 }, confidence: 0.9 },
		});
		const result = await orch.handleRequest("extract invoices", ctx);
		expect(calls).toEqual(["scripta:step-1"]);
		expect(result.success).toBe(false);
		expect(result.conflicts).toEqual([]);
		expect(typeof (result.data as { error: string }).error).toBe("string");
	});

	it("reuses an unknown session id by creating a new session", async () => {
		const { orch } = build({
			scripta: { data: { a: 1 }, confidence: 0.9 },
			regula: { data: {}, confidence: 0.9 },
		});
		const result = await orch.handleRequest("list", ctx, "missing-session");
		expect(result.success).toBe(true);
		expect(result.sessionId).not.toBe("missing-session");
	});
});
