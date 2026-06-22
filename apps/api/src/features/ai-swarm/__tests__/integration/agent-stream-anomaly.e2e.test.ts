import { Elysia } from "elysia";
import { beforeAll, describe, expect, it, vi } from "vitest";

type AiSwarmRoutesModule = typeof import("../../api/routes");
let aiSwarmRoutes: AiSwarmRoutesModule["aiSwarmRoutes"];

interface ParsedSseEvent {
	event: string;
	data: unknown;
}

function parseSsePayload(payload: string): ParsedSseEvent[] {
	const events: ParsedSseEvent[] = [];

	let currentEvent = "";
	let currentData = "";

	const flush = () => {
		if (!currentEvent || !currentData) return;

		try {
			events.push({
				event: currentEvent,
				data: JSON.parse(currentData),
			});
		} catch {
			events.push({
				event: currentEvent,
				data: currentData,
			});
		}

		currentEvent = "";
		currentData = "";
	};

	for (const line of payload.split("\n")) {
		if (line.startsWith("event: ")) {
			currentEvent = line.slice("event: ".length).trim();
			continue;
		}
		if (line.startsWith("data: ")) {
			currentData = line.slice("data: ".length).trim();
			continue;
		}
		if (line.trim() === "") {
			flush();
		}
	}

	flush();
	return events;
}

describe("AI Swarm SSE anomaly E2E", () => {
	beforeAll(async () => {
		process.env.OPENROUTER_API_KEY = "";
		vi.resetModules();
		({ aiSwarmRoutes } = await import("../../api/routes"));
	});

	it("emits precise INVALID_IGV alert and resolves in <= 37s", async () => {
		const app = new Elysia().use(aiSwarmRoutes);
		const startedAt = Date.now();

		const response = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/api/ai-swarm/agent-stream?documentId=DOC-ANOM-001&ruc=20100070970&serie=F001&numero=1&fecha=2026-02-18&moneda=PEN&subtotal=100&igv=40&total=140",
			),
		);
		const rawSse = await response.text();
		const durationMs = Date.now() - startedAt;

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");
		expect(durationMs).toBeLessThanOrEqual(37000);

		const events = parseSsePayload(rawSse);
		expect(events.some((event) => event.event === "workflow-start")).toBe(true);
		expect(
			events.some(
				(event) =>
					event.event === "agent-status" &&
					typeof event.data === "object" &&
					event.data !== null &&
					"agentId" in event.data &&
					event.data.agentId === "validador",
			),
		).toBe(true);

		const workflowComplete = events.find(
			(event) => event.event === "workflow-complete",
		);
		expect(workflowComplete).toBeTruthy();

		const completedData =
			workflowComplete &&
			typeof workflowComplete.data === "object" &&
			workflowComplete.data !== null
				? (workflowComplete.data as {
						status: string;
						result?: {
							decision: string;
							validation: {
								errors: Array<{ code: string }>;
							};
						};
					})
				: null;

		expect(completedData?.status).toBe("success");
		// IGV=40 on subtotal=100 triggers BOTH INVALID_IGV (error) AND SUNAT_AI_IGV_DRIFT (critical)
		// via runSunatAiParitySubagent → arbiter returns 'rejected' for critical errors.
		expect(completedData?.result?.decision).toBe("rejected");
		expect(
			completedData?.result?.validation.errors.some(
				(error) => error.code === "INVALID_IGV",
			),
		).toBe(true);
	});
});
