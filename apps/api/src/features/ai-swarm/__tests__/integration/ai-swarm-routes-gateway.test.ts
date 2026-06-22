import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { Elysia } from "elysia";

type AiSwarmRoutesModule = typeof import("../../api/routes");
let aiSwarmRoutes: AiSwarmRoutesModule["aiSwarmRoutes"];

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
	process.env = { ...ORIGINAL_ENV };
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
				"x-company-id": "cmp-adv-1",
				"x-organization-id": "org-1",
			},
			body: JSON.stringify(body),
		}),
	);
}

describe("AI Swarm Routes Gateway", () => {
	beforeAll(async () => {
		vi.resetModules();
		({ aiSwarmRoutes } = await import("../../api/routes"));
	});

	beforeEach(() => {
		process.env.OPENROUTER_API_KEY = "";
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "false";
	});

	afterEach(() => {
		restoreEnv();
	});

	it("validates invoices through workflow route", async () => {
		const response = await postJson(
			aiSwarmRoutes,
			"/api/ai-swarm/api/ai-swarm/validate-invoices",
			{invoices: [
				{
					id: "INV-RT-001",
					ruc: "20100070970",
					serie: "F001",
					numero: "00000001",
					fecha: "2026-02-18",
					moneda: "PEN",
					subtotal: 100,
					igv: 18,
					total: 118,
					items: [],
				},
			],
			priority: "medium",
		});

		const payload = await response.json();
		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.totalProcessed).toBe(1);
		expect(payload.data.totalValid).toBe(1);
	});

	it("analyzes task strategy before execution", async () => {
		const app = new Elysia().use(aiSwarmRoutes);
		const response = await postJson(
			app,
			"/api/ai-swarm/api/ai-swarm/analyze-task",
			{fileCount: 3,
			totalSizeBytes: 2048,
			taskType: "INVOICE",
			priority: "medium",
		});

		const payload = await response.json();
		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.shouldParallelize).toBe(false);
		expect(payload.data.batchSize).toBe(1);
	});

	it("runs adversarial SIRE audit and returns arbiter decision", async () => {
		const app = new Elysia().use(aiSwarmRoutes);
		const response = await postJson(
			app,
			"/api/ai-swarm/api/ai-swarm/sire-adversarial-audit",
			{
				companyId: "cmp-adv-1",
				ruc: "20100070970",
				period: "2026-07",
				declaredIgvPen: 180,
				salesTotalPen: 1000,
				rvieRecords: 10,
				rceRecords: 8,
				pleSalesRecords: 10,
				plePurchaseRecords: 8,
				falsePositiveRate: 0.02,
			},
		);

		const payload = await response.json();
		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.creator).toBeTruthy();
		expect(payload.data.destructor).toBeTruthy();
		expect(payload.data.arbiter).toBeTruthy();
		expect(payload.data.arbiter.decision).toBe("approved");
	});

	it("returns budget and cache observability endpoints", async () => {
		const app = new Elysia().use(aiSwarmRoutes);

		const budgetResponse = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/api/ai-swarm/budget",
				{ method: "GET" },
			),
		);
		const cacheResponse = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/api/ai-swarm/cache/stats",
				{ method: "GET" },
			),
		);
		const detailedBudgetResponse = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/api/ai-swarm/budget/detailed",
				{ method: "GET" },
			),
		);

		const budgetPayload = await budgetResponse.json();
		const cachePayload = await cacheResponse.json();
		const detailedPayload = await detailedBudgetResponse.json();

		expect(budgetResponse.status).toBe(200);
		expect(cacheResponse.status).toBe(200);
		expect(detailedBudgetResponse.status).toBe(200);
		expect(budgetPayload.success).toBe(true);
		expect(cachePayload.success).toBe(true);
		expect(typeof cachePayload.data.size).toBe("number");
		expect(detailedPayload.success).toBe(true);
		expect(detailedPayload.data.usage).toBeTruthy();
		expect(Array.isArray(detailedPayload.data.trend)).toBe(true);
	});

	it("blocks process-invoices when OPENROUTER key is missing", async () => {
		const app = new Elysia().use(aiSwarmRoutes);
		const response = await postJson(
			app,
			"/api/ai-swarm/api/ai-swarm/process-invoices",
			{documents: [
				{
					id: "DOC-001",
					imageUrl: "data:image/png;base64,AA==",
					filename: "invoice.pdf",
					mimeType: "application/pdf",
				},
			],
			priority: "medium",
		});

		const payload = await response.json();
		expect(response.status).toBe(400);
		expect(payload.success).toBe(false);
		expect(payload.error).toContain("OPENROUTER_API_KEY");
	});

	it("applies governance kill switch before key checks", async () => {
		process.env.AUTONOMY_GLOBAL_KILL_SWITCH = "true";
		const app = new Elysia().use(aiSwarmRoutes);

		const response = await postJson(
			app,
			"/api/ai-swarm/api/ai-swarm/process-invoices",
			{documents: [
				{
					id: "DOC-002",
					imageUrl: "data:image/png;base64,AA==",
					filename: "invoice.pdf",
					mimeType: "application/pdf",
				},
			],
			priority: "high",
		});

		const payload = await response.json();
		expect(response.status).toBe(503);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("AUTONOMY_KILL_SWITCH_ACTIVE");
	});

	it("returns 400 for multi-ruc and reconcile when key is missing", async () => {
		const app = new Elysia().use(aiSwarmRoutes);

		const multiRucResponse = await postJson(
			app,
			"/api/ai-swarm/api/ai-swarm/multi-ruc-process",
			{
				companies: [
					{
						ruc: "20100070970",
						companyName: "Demo Co",
						documents: [
							{
								id: "DOC-A",
								imageUrl: "data:image/png;base64,AA==",
								filename: "f-a.pdf",
								mimeType: "application/pdf",
							},
						],
					},
				],
				priority: "low",
			},
		);

		const reconcileResponse = await postJson(
			app,
			"/api/ai-swarm/api/ai-swarm/reconcile",
			{
			priority: "medium",
			transactions: [],
			documents: [],
		});

		const multiRucPayload = await multiRucResponse.json();
		const reconcilePayload = await reconcileResponse.json();

		expect(multiRucResponse.status).toBe(400);
		expect(reconcileResponse.status).toBe(400);
		expect(multiRucPayload.success).toBe(false);
		expect(reconcilePayload.success).toBe(false);
	});
});
