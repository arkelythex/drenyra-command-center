import { createHash } from "node:crypto";
import type { BrowserContext, Route } from "@playwright/test";

/**
 * In-memory fake of `/api/v1/missions`, faithful to the contract the web
 * client relies on (apps/api missions service):
 *  - one mission per company, period and intent: creating again answers 409
 *    with the existing id;
 *  - every mutation carries `expectedMissionVersion` and a stale one is a 409;
 *  - approving derives a SHA-256 receipt hash and a UUID-shaped receipt id.
 * It exercises the real HTTP transport (no in-app mock), and counts calls so
 * specs can assert a mission is created and executed exactly once.
 */

type Status =
	| "DRAFT"
	| "AWAITING_APPROVAL"
	| "APPROVED"
	| "REJECTED"
	| "UNKNOWN"
	| "RUNNING"
	| "FAILED"
	| "COMPLETED";

interface Snapshot {
	id: string;
	companyId: string;
	fiscalPeriod: string;
	intent: string;
	status: Status;
	version: number;
	progress: number;
	steps: Array<{ id: string; name: string; status: string }>;
	currentStep: string;
	blockers: unknown[];
	proposal: Proposal | null;
	rejection: {
		reason: string;
		rejectedBy: string;
		rejectedAt: string;
		proposalVersion: number;
	} | null;
	receiptId: string | null;
	receiptHash: string | null;
	lastEventSequence: number;
	createdAt: string;
	updatedAt: string;
}

interface Proposal {
	id: string;
	missionId: string;
	version: number;
	evidence: Array<{ id: string; label: string; type: string }>;
	evidenceHash: string;
	summary: string;
	riskLevel: "LOW" | "MEDIUM" | "HIGH";
	generatedAt: string;
}

export interface MissionApiOptions {
	/** What `execute` leaves the mission in. UNKNOWN simulates a timeout whose outcome is not confirmed. */
	afterExecute?: "AWAITING_APPROVAL" | "UNKNOWN";
}

export interface MissionApiCalls {
	create: number;
	execute: number;
	approve: number;
	reject: number;
	reconcile: number;
}

const envelope = (data: unknown) => ({ success: true, data });
const failure = (
	code: string,
	message: string,
	details?: Record<string, unknown>,
) => ({
	success: false,
	error: { code, message, ...(details ? { details } : {}) },
});

type Body = Record<string, unknown>;
interface Reply {
	status: number;
	json: unknown;
}
const ok = (data: unknown, status = 200): Reply => ({
	status,
	json: envelope(data),
});
const fail = (
	status: number,
	code: string,
	message: string,
	details?: Record<string, unknown>,
): Reply => ({
	status,
	json: failure(code, message, details),
});

const COMPANY_ID = "00000000-0000-0000-0000-000000000001";

function newSnapshot(id: string, body: Body): Snapshot {
	const now = new Date().toISOString();
	return {
		id,
		companyId: COMPANY_ID,
		fiscalPeriod: String(body.fiscalPeriod),
		intent: String(body.intent),
		status: "DRAFT",
		version: 1,
		progress: 0,
		steps: [],
		currentStep: "",
		blockers: [],
		proposal: null,
		rejection: null,
		receiptId: null,
		receiptHash: null,
		lastEventSequence: 0,
		createdAt: now,
		updatedAt: now,
	};
}

/** Every mutation moves the version and the event sequence forward, as the server does. */
function advance(mission: Snapshot, patch: Partial<Snapshot>): Snapshot {
	return Object.assign(mission, patch, {
		version: mission.version + 1,
		lastEventSequence: mission.lastEventSequence + 1,
		updatedAt: new Date().toISOString(),
	});
}

function proposalFor(mission: Snapshot): Proposal {
	return {
		id: `prop-${mission.id}`,
		missionId: mission.id,
		version: 1,
		evidence: [
			{
				id: "e1",
				label: "Registro de ventas y compras conciliado",
				type: "report",
			},
		],
		evidenceHash: createHash("sha256")
			.update(`${mission.id}:evidence`)
			.digest("hex"),
		summary: `Cierre mensual ${mission.fiscalPeriod}`,
		riskLevel: "MEDIUM",
		generatedAt: new Date().toISOString(),
	};
}

/** Receipt id is the first 32 hex chars of the hash, shaped as a UUID (missions.service receiptIdFromHash). */
function receiptFor(mission: Snapshot, evidenceHash: unknown) {
	const receiptHash = createHash("sha256")
		.update(`${mission.id}:${String(evidenceHash)}`)
		.digest("hex");
	const receiptId = receiptHash
		.slice(0, 32)
		.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
	return { receiptHash, receiptId };
}

type Action = (mission: Snapshot, body: Body) => Reply;

export async function installMissionApi(
	context: BrowserContext,
	options: MissionApiOptions = {},
) {
	const missions = new Map<string, Snapshot>();
	const calls: MissionApiCalls = {
		create: 0,
		execute: 0,
		approve: 0,
		reject: 0,
		reconcile: 0,
	};

	const create = (body: Body): Reply => {
		calls.create++;
		const existing = [...missions.values()].find(
			(m) => m.fiscalPeriod === body.fiscalPeriod && m.intent === body.intent,
		);
		if (existing)
			return fail(
				409,
				"MISSION_EXISTS",
				"Ya existe una misión para este período",
				{ missionId: existing.id },
			);
		const mission = newSnapshot(`mis-${missions.size + 1}`, body);
		missions.set(mission.id, mission);
		return ok(mission, 201);
	};

	const actions: Record<string, Action> = {
		execute: (mission) => {
			calls.execute++;
			if (mission.status !== "DRAFT")
				return fail(409, "INVALID_TRANSITION", "La misión ya fue ejecutada");
			if (options.afterExecute === "UNKNOWN")
				return ok(advance(mission, { status: "UNKNOWN" }));
			return ok(
				advance(mission, {
					status: "AWAITING_APPROVAL",
					progress: 7000,
					currentStep: "approval",
					steps: [
						{ id: "p1", name: "Propuesta generada", status: "COMPLETED" },
					],
					proposal: proposalFor(mission),
				}),
			);
		},
		approve: (mission, body) => {
			calls.approve++;
			return ok(
				advance(mission, {
					status: "APPROVED",
					...receiptFor(mission, body.evidenceHash),
				}),
			);
		},
		reject: (mission, body) => {
			calls.reject++;
			const rejection = {
				reason: String(body.reason),
				rejectedBy: "demo@drenyra.pe",
				rejectedAt: new Date().toISOString(),
				proposalVersion: Number(body.proposalVersion ?? 1),
			};
			return ok(advance(mission, { status: "REJECTED", rejection }));
		},
		reconcile: (mission, body) => {
			calls.reconcile++;
			return ok(advance(mission, { status: body.resolution as Status }));
		},
	};

	const respond = (
		method: string,
		id: string | undefined,
		action: string | undefined,
		body: Body,
	): Reply => {
		if (!id)
			return method === "POST"
				? create(body)
				: fail(404, "NOT_FOUND", "Ruta no encontrada");
		const mission = missions.get(id);
		if (!mission) return fail(404, "MISSION_NOT_FOUND", "Misión no encontrada");
		if (method === "GET") return ok(mission);
		if (body.expectedMissionVersion !== mission.version) {
			return fail(
				409,
				"VERSION_CONFLICT",
				`Versión esperada ${String(body.expectedMissionVersion)}, actual ${mission.version}`,
			);
		}
		const handler = action ? actions[action] : undefined;
		return handler
			? handler(mission, body)
			: fail(404, "NOT_FOUND", "Ruta no encontrada");
	};

	await context.route(
		(url) => url.pathname.startsWith("/api/v1/missions"),
		async (route: Route) => {
			const request = route.request();
			const [, , , , id, action] = new URL(request.url()).pathname.split("/"); // /api/v1/missions/:id/:action
			const body = (request.postDataJSON() as Body | null) ?? {};
			const { status, json } = respond(request.method(), id, action, body);
			await route.fulfill({ status, json });
		},
	);
	return { calls, missions };
}
