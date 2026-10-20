import { MissionError, MissionErrorCode } from "@drenyra/mission-domain";
import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveSessionContext, service, constructedWith, realDb } = vi.hoisted(
	() => ({
		resolveSessionContext: vi.fn(),
		service: {
			createMission: vi.fn(),
			getMission: vi.fn(),
			executeMission: vi.fn(),
			approveMission: vi.fn(),
			rejectMission: vi.fn(),
			reconcileMission: vi.fn(),
		},
		constructedWith: [] as unknown[],
		realDb: { name: "persistence-client-db" },
	}),
);

vi.mock("../../security/session-context", () => ({ resolveSessionContext }));
vi.mock("@drenyra/persistence/client", () => ({ db: realDb }));
vi.mock("../intent-handlers/wire-monthly-close", () => ({
	wireMonthlyCloseHandler: vi.fn(),
}));
vi.mock("../mission-memory.recorder", () => ({
	createMissionMemoryRecorder: vi.fn(() => undefined),
}));
vi.mock("../missions.service", () => ({
	MissionsService: class {
		constructor(db: unknown) {
			constructedWith.push(db);
			// biome-ignore lint/correctness/noConstructorReturn: test double
			return service;
		}
	},
}));

import { missionsModule } from "../missions.module";
import { createMissionsRoutes } from "../missions.routes";

const COMPANY = "11111111-1111-4111-8111-111111111111";
const MISSION = "22222222-2222-4222-8222-222222222222";
const PROPOSAL = "33333333-3333-4333-8333-333333333333";
const FOREIGN = "44444444-4444-4444-8444-444444444444";
const EVIDENCE_HASH =
	"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945";

const snapshot = {
	id: MISSION,
	companyId: COMPANY,
	status: "DRAFT",
	version: 1,
};

let app: { handle: (r: Request) => Promise<Response> };

function call(method: string, path: string, body?: unknown) {
	return app.handle(
		new Request(`http://localhost/api/v1/missions${path}`, {
			method,
			headers: { "Content-Type": "application/json" },
			body: body === undefined ? undefined : JSON.stringify(body),
		}),
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	app = new Elysia().use(createMissionsRoutes({}));
	resolveSessionContext.mockResolvedValue({
		ok: true,
		context: {
			userId: "user-1",
			authUserId: "user-1",
			legacyUserId: null,
			role: "admin",
			companyId: COMPANY,
		},
	});
});

describe("missions module wiring", () => {
	it("builds the service on the real database, not null", () => {
		expect(missionsModule).toBeDefined();
		expect(constructedWith).toContain(realDb);
		expect(constructedWith).not.toContain(null);
	});
});

describe("missions API: success statuses keep the {success,data} envelope", () => {
	it("creates a mission with 201", async () => {
		service.createMission.mockResolvedValue(snapshot);
		const response = await call("POST", "/", {
			fiscalPeriod: "2026-09",
			intent: "monthly-close",
			input: { instruction: "Cerrar septiembre" },
		});

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ success: true, data: snapshot });
		expect(service.createMission).toHaveBeenCalledWith(
			COMPANY,
			expect.objectContaining({ companyId: COMPANY }),
		);
	});

	it("refuses to create a mission for another company", async () => {
		const response = await call("POST", "/", {
			companyId: FOREIGN,
			fiscalPeriod: "2026-09",
			intent: "monthly-close",
			input: { instruction: "Cerrar septiembre" },
		});

		expect(response.status).toBe(403);
		expect(service.createMission).not.toHaveBeenCalled();
	});

	it("reads its own mission with 200", async () => {
		service.getMission.mockResolvedValue(snapshot);
		const response = await call("GET", `/${MISSION}`);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, data: snapshot });
	});
});

describe("missions API: errors carry a real HTTP status", () => {
	it.each([
		["GET", `/${MISSION}`],
		["GET", `/${MISSION}/gates`],
		["GET", `/${MISSION}/exceptions`],
		["GET", `/${MISSION}/receipt/verify`],
	])(
		"%s %s answers 404 when the mission is not this company's",
		async (method, path) => {
			service.getMission.mockResolvedValue(null);
			const response = await call(method, path);

			expect(response.status).toBe(404);
			expect(await response.json()).toMatchObject({
				success: false,
				error: { code: "MISSION_NOT_FOUND" },
			});
		},
	);

	it("uses the MissionError status, e.g. 409 on a version conflict", async () => {
		service.approveMission.mockRejectedValue(
			new MissionError(MissionErrorCode.VERSION_CONFLICT, 409, "stale"),
		);
		const response = await call("POST", `/${MISSION}/approve`, {
			proposalId: PROPOSAL,
			proposalVersion: 1,
			evidenceHash: EVIDENCE_HASH,
			expectedMissionVersion: 1,
		});

		expect(response.status).toBe(409);
		expect(await response.json()).toMatchObject({
			success: false,
			error: { code: "VERSION_CONFLICT" },
		});
	});

	it("answers 404 when executing a mission of another company", async () => {
		service.executeMission.mockRejectedValue(
			new MissionError(MissionErrorCode.MISSION_NOT_FOUND, 404, "nope"),
		);
		const response = await call("POST", `/${MISSION}/execute`, {
			expectedMissionVersion: 1,
		});
		expect(response.status).toBe(404);
	});

	it("answers 500 without leaking the internal error message", async () => {
		service.rejectMission.mockRejectedValue(
			new Error('relation "accounting_missions" does not exist'),
		);
		const response = await call("POST", `/${MISSION}/reject`, {
			proposalId: PROPOSAL,
			proposalVersion: 1,
			reason: "Faltan sustentos",
			expectedMissionVersion: 1,
		});
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body).toMatchObject({
			success: false,
			error: { code: "INTERNAL_ERROR" },
		});
		expect(JSON.stringify(body)).not.toContain("accounting_missions");
	});

	it("refuses a mission id that is not a UUID before touching the database", async () => {
		const response = await call("GET", "/mission-made-up-by-the-web");
		expect(response.status).toBe(422);
		expect(service.getMission).not.toHaveBeenCalled();
	});
});
