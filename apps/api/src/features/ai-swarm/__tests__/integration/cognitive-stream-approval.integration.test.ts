import { beforeEach, describe, expect, it, vi } from "vitest";
import { Elysia } from "elysia";

type ApprovalHandler = (request: {
	name: string;
	args: unknown;
	toolCallId: string;
}) => Promise<boolean>;

const streamWithToolExecutionMock = vi.fn(async function* (
	_service: unknown,
	_request: unknown,
	options?: { approvalHandler?: ApprovalHandler },
) {
	yield { type: "token", content: "inicio " } as const;

	const approvalRequest = {
		name: "crear_asiento",
		args: { amount: 118 },
		toolCallId: "tool-001",
	};

	yield { type: "approval_required", ...approvalRequest } as const;

	const approved = options?.approvalHandler
		? await options.approvalHandler(approvalRequest)
		: false;

	yield {
		type: "approval_decision",
		name: approvalRequest.name,
		toolCallId: approvalRequest.toolCallId,
		approved,
	} as const;

	if (approved) {
		yield { type: "token", content: "aprobado" } as const;
	} else {
		yield {
			type: "tool_error",
			name: approvalRequest.name,
			error: "Tool execution denied by human approval gate",
		} as const;
	}

	yield { type: "done", finish_reason: "stop" } as const;
});

vi.mock("@drenyra/infrastructure/ai/openrouter", () => ({
	OpenRouterService: class OpenRouterService {
		constructor(_config: unknown) {}
	},
}));

vi.mock("@drenyra/ai/model-registry", () => ({
	getOpenRouterModelForTier: () => "openai/gpt-5.1",
}));

vi.mock("@drenyra/infrastructure/ai/tool-bridge", () => ({
	getOpenRouterTools: () => [],
	streamWithToolExecution: (
		service: unknown,
		request: unknown,
		options?: { approvalHandler?: ApprovalHandler },
	) => streamWithToolExecutionMock(service, request, options),
}));

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
			events.push({ event: currentEvent, data: JSON.parse(currentData) });
		} catch {
			events.push({ event: currentEvent, data: currentData });
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
		if (line.trim() === "") flush();
	}

	flush();
	return events;
}

async function postJson(
	app: Elysia,
	path: string,
	body: unknown,
): Promise<Response> {
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-auth-user-id": "auth-user-1",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
			body: JSON.stringify(body),
		}),
	);
}

async function get(app: Elysia, path: string): Promise<Response> {
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "GET",
			headers: {
				"x-auth-user-id": "auth-user-1",
				"x-user-id": "11111111-1111-1111-1111-111111111111",
				"x-user-role": "admin",
				"x-company-id": "cmp-1",
			},
		}),
	);
}

async function wait(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Cognitive Stream approval flow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENROUTER_API_KEY = "test-key";
		process.env.COGNITIVE_APPROVAL_REQUIRE_PAIRING = "false";
	});

	it("waits for human approval and resumes stream after approval", async () => {
		const { cognitiveApprovalPersistence } = await import(
			"../../api/cognitive-approval.persistence"
		);
		const resolveDecisionSpy = vi.spyOn(
			cognitiveApprovalPersistence,
			"resolveDecision",
		);
		const { cognitiveStreamRoute } = await import(
			"../../api/cognitive-stream.route"
		);
		const app = new Elysia().use(cognitiveStreamRoute);

		const response = await postJson(app, "/api/ai-swarm/cognitive-stream", {
			companyId: "cmp-1",
			messages: [{ role: "user", content: "registra el gasto" }],
			runId: "run-fixed-001",
			modelTier: "fast",
			tools: true,
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");

		const rawSsePromise = response.text();

		let approvalResponse: Response | null = null;
		for (let attempt = 0; attempt < 20; attempt++) {
			approvalResponse = await postJson(
				app,
				"/api/ai-swarm/cognitive-stream/approval",
				{
					companyId: "cmp-1",
					runId: "run-fixed-001",
					toolCallId: "tool-001",
					approved: true,
				},
			);
			if (approvalResponse.status === 200) break;
			await wait(5);
		}

		expect(approvalResponse?.status).toBe(200);

		const rawSse = await rawSsePromise;
		const events = parseSsePayload(rawSse);

		const decisionEvent = events.find(
			(entry) => entry.event === "approval_decision",
		);
		const decisionData =
			decisionEvent &&
			typeof decisionEvent.data === "object" &&
			decisionEvent.data !== null
				? (decisionEvent.data as {
						runId: string;
						approved: boolean;
						toolCallId: string;
					})
				: null;

		expect(events.some((entry) => entry.event === "approval_required")).toBe(
			true,
		);
		expect(decisionData?.runId).toBe("run-fixed-001");
		expect(decisionData?.toolCallId).toBe("tool-001");
		expect(decisionData?.approved).toBe(true);
		expect(resolveDecisionSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				decidedBy: "auth-user-1",
			}),
		);
	});

	it("returns 404 when resolving unknown approval request", async () => {
		const { cognitiveStreamRoute } = await import(
			"../../api/cognitive-stream.route"
		);
		const app = new Elysia().use(cognitiveStreamRoute);

		const response = await postJson(
			app,
			"/api/ai-swarm/cognitive-stream/approval",
			{
				companyId: "cmp-1",
				runId: "missing-run",
				toolCallId: "missing-tool",
				approved: false,
			},
		);

		expect(response.status).toBe(404);
		const payload = await response.json();
		expect(payload.success).toBe(false);
	});

	it("returns run state payload for resume by runId", async () => {
		const { cognitiveStreamRoute } = await import(
			"../../api/cognitive-stream.route"
		);
		const app = new Elysia().use(cognitiveStreamRoute);

		const response = await get(
			app,
			"/api/ai-swarm/cognitive-stream/runs/run-fixed-001/state?companyId=cmp-1",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.runId).toBe("run-fixed-001");
		expect(Array.isArray(payload.data.pendingApprovals)).toBe(true);
	});
});
