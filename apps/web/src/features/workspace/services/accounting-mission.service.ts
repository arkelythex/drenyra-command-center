/**
 * AccountingMissionService — client for @drenyra/pi harness API.
 *
 * @drenyra/pi runs as its own agent runtime, separate from gentle-pi.
 * Mock mode: only when VITE_DRENYRA_MISSION_TRANSPORT=mock.
 */

export interface RunIntentCommand {
	commandId: string;
	missionId: string;
	organizationId: string;
	companyId: string;
	companyName: string;
	companyRuc: string;
	fiscalPeriodId: string;
	intent:
		| "monthly-close"
		| "reconciliation"
		| "invoice-review"
		| "compliance-check";
	input: { instruction: string };
	idempotencyKey: string;
	expectedMissionVersion: number;
}

export interface ApproveCommand {
	missionId: string;
	proposalId: string;
	proposalVersion: number;
	decision: "APPROVE" | "REJECT";
	reason?: string;
	idempotencyKey: string;
}

export interface MissionStep {
	id: string;
	label: string;
	status: "pending" | "active" | "completed" | "blocked" | "failed";
	evidence?: Array<{
		id: string;
		label: string;
		type: string;
		verified: boolean;
	}>;
}

export interface MissionProposal {
	id: string;
	version: number;
	summary: string;
	riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	requiresApproval: boolean;
	approvalLevel: "R1" | "R2" | "R3";
	evidence: Array<{ id: string; label: string; type: string }>;
	createdAt: string;
}

export interface MissionSnapshot {
	missionId: string;
	status:
		| "DRAFT"
		| "QUEUED"
		| "RUNNING"
		| "BLOCKED"
		| "AWAITING_APPROVAL"
		| "APPROVED"
		| "REJECTED"
		| "COMPLETED"
		| "FAILED";
	progress: number;
	steps: MissionStep[];
	currentStep: string;
	blockers: Array<{ id: string; reason: string; severity: string }>;
	proposal: MissionProposal | null;
	version: number;
	rejection?: {
		reason: string;
		rejectedBy: string;
		rejectedAt: string;
		proposalVersion: number;
	};
	receiptId?: string;
	lastEventSequence?: number;
}

export type HarnessError =
	| { type: "API_ERROR"; status: number; message: string }
	| { type: "NETWORK_ERROR"; message: string }
	| { type: "TIMEOUT"; message: string };

const API_BASE =
	import.meta.env.VITE_DRENYRA_API_URL ?? "http://localhost:3000";
const IS_MOCK = import.meta.env.VITE_DRENYRA_MISSION_TRANSPORT === "mock";

// ─── Mock generator ──────────────────────────────────────────────────────────

let mockCounter = 0;
async function* mockGenerator(
	cmd: RunIntentCommand,
): AsyncGenerator<MissionSnapshot> {
	const mid = `mock-${cmd.missionId}-${++mockCounter}`;
	yield {
		missionId: mid,
		status: "QUEUED",
		progress: 0,
		steps: [],
		currentStep: "",
		blockers: [],
		proposal: null,
		version: 1,
		lastEventSequence: 1,
	};
	yield {
		missionId: mid,
		status: "RUNNING",
		progress: 0.3,
		steps: [
			{
				id: "a1",
				label: `Analizando: ${cmd.input.instruction.slice(0, 80)}`,
				status: "active",
			},
		],
		currentStep: "analyze",
		blockers: [],
		proposal: null,
		version: 1,
		lastEventSequence: 2,
	};
	yield {
		missionId: mid,
		status: "AWAITING_APPROVAL",
		progress: 1,
		steps: [
			{
				id: "a1",
				label: "Análisis completado",
				status: "completed",
				evidence: [
					{
						id: "e1",
						label: "Resumen del análisis",
						type: "report",
						verified: true,
					},
				],
			},
			{ id: "p1", label: "Propuesta generada", status: "completed" },
		],
		currentStep: "approval",
		blockers: [],
		proposal: {
			id: `prop-${mid}`,
			version: 1,
			summary: cmd.input.instruction,
			riskLevel: "MEDIUM",
			requiresApproval: true,
			approvalLevel: "R2",
			evidence: [{ id: "e1", label: "Análisis automático", type: "report" }],
			createdAt: new Date().toISOString(),
		},
		version: 2,
		lastEventSequence: 3,
	};
}

// ─── SSE stream with sequence tracking ──────────────────────────────────────

async function* streamHarnessEvents(
	response: Response,
	fromSequence = 0,
): AsyncGenerator<MissionSnapshot> {
	const reader = response.body?.getReader();
	if (!reader) return;
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			if (line.startsWith("data: ")) {
				try {
					const parsed = JSON.parse(line.slice(6)) as MissionSnapshot;
					if (
						parsed.lastEventSequence &&
						parsed.lastEventSequence <= fromSequence
					)
						continue; // skip already-seen
					yield parsed;
				} catch {
					/* skip */
				}
			}
		}
	}
}

// ─── POST /harness/execute — run a mission ──────────────────────────────────

export async function* executeRunIntent(
	command: RunIntentCommand,
): AsyncGenerator<MissionSnapshot> {
	if (IS_MOCK) {
		yield* mockGenerator(command);
		return;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30_000);

	try {
		const response = await fetch(`${API_BASE}/harness/execute`, {
			signal: controller.signal,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessionStorage.getItem("drenyra-auth-token") ?? ""}`,
				"X-Idempotency-Key": command.idempotencyKey,
			},
			body: JSON.stringify({
				commandId: command.commandId,
				missionId: command.missionId,
				organizationId: command.organizationId,
				companyId: command.companyId,
				fiscalPeriodId: command.fiscalPeriodId,
				intent: command.intent,
				input: command.input,
				idempotencyKey: command.idempotencyKey,
				expectedMissionVersion: command.expectedMissionVersion,
			}),
		});
		if (!response.ok) {
			const body = await response.text().catch(() => "");
			throw Object.assign(new Error(`API error: ${response.status}`), {
				type: "API_ERROR",
				status: response.status,
				message: body || response.statusText,
			}) as HarnessError & Error;
		}
		const ct = response.headers.get("content-type") ?? "";
		if (ct.includes("text/event-stream")) {
			for await (const ev of streamHarnessEvents(response)) yield ev;
		} else {
			yield (await response.json()) as MissionSnapshot;
		}
	} catch (error: unknown) {
		if ((error as Error).name === "AbortError")
			throw {
				type: "TIMEOUT",
				message: "La solicitud al harness expiró después de 30s",
			} as HarnessError;
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

// ─── GET /missions/:id — snapshot polling / reconnection ────────────────────

export async function getMissionSnapshot(
	missionId: string,
): Promise<MissionSnapshot> {
	if (IS_MOCK) throw new Error("No snapshot in mock mode");
	const res = await fetch(`${API_BASE}/missions/${missionId}`, {
		headers: {
			Authorization: `Bearer ${sessionStorage.getItem("drenyra-auth-token") ?? ""}`,
		},
	});
	if (!res.ok)
		throw Object.assign(new Error(`Snapshot error: ${res.status}`), {
			type: "API_ERROR",
			status: res.status,
			message: res.statusText,
		}) as HarnessError & Error;
	return res.json() as Promise<MissionSnapshot>;
}

// ─── POST /missions/:id/approve — human approval ────────────────────────────

export async function approveMission(
	cmd: ApproveCommand,
): Promise<{ receiptId: string }> {
	if (IS_MOCK) return { receiptId: `rcpt-mock-${cmd.missionId}` };
	const res = await fetch(`${API_BASE}/missions/${cmd.missionId}/approve`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Idempotency-Key": cmd.idempotencyKey,
			Authorization: `Bearer ${sessionStorage.getItem("drenyra-auth-token") ?? ""}`,
		},
		body: JSON.stringify({
			proposalId: cmd.proposalId,
			proposalVersion: cmd.proposalVersion,
			decision: cmd.decision,
			reason: cmd.reason,
		}),
	});
	if (!res.ok)
		throw Object.assign(new Error(`Approval error: ${res.status}`), {
			type: "API_ERROR",
			status: res.status,
			message: res.statusText,
		}) as HarnessError & Error;
	return res.json() as Promise<{ receiptId: string }>;
}

// ─── POST /missions/:id/reject — human rejection ────────────────────────────

export async function rejectMission(cmd: ApproveCommand): Promise<void> {
	if (IS_MOCK) return;
	const res = await fetch(`${API_BASE}/missions/${cmd.missionId}/reject`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Idempotency-Key": cmd.idempotencyKey,
			Authorization: `Bearer ${sessionStorage.getItem("drenyra-auth-token") ?? ""}`,
		},
		body: JSON.stringify({
			proposalId: cmd.proposalId,
			proposalVersion: cmd.proposalVersion,
			reason: cmd.reason,
		}),
	});
	if (!res.ok)
		throw Object.assign(new Error(`Rejection error: ${res.status}`), {
			type: "API_ERROR",
			status: res.status,
			message: res.statusText,
		}) as HarnessError & Error;
}
