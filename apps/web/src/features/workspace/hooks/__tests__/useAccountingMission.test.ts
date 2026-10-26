import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const transport = vi.hoisted(() => ({
	createMission: vi.fn(),
	executeMission: vi.fn(),
	getMission: vi.fn(),
	approveMission: vi.fn(),
	rejectMission: vi.fn(),
	reconcileMission: vi.fn(),
}));

vi.mock("../../services/http-mission-transport", () => transport);

import { useAccountingMission } from "../useAccountingMission";
import { MISSION_POLL_INTERVAL_MS } from "../useMissionExecution";

const ID = "22222222-2222-4222-8222-222222222222";
const proposal = {
	id: "33333333-3333-4333-8333-333333333333",
	version: 1,
	evidenceHash: "a".repeat(64),
};

function snap(status: string, version: number, extra: object = {}) {
	return {
		id: ID,
		companyId: "company-1",
		fiscalPeriod: "2026-09",
		intent: "monthly-close",
		status,
		version,
		progress: 0,
		steps: [],
		currentStep: "",
		blockers: [],
		proposal: null,
		rejection: null,
		receiptId: null,
		receiptHash: null,
		lastEventSequence: 0,
		...extra,
	};
}

const command = {
	fiscalPeriod: "2026-09",
	intent: "monthly-close" as const,
	input: { instruction: "Cierre mensual 09/2026" },
	idempotencyKey: "company-1-2026-09",
};

beforeEach(() => {
	vi.useFakeTimers();
	for (const fn of Object.values(transport)) fn.mockReset();
});

afterEach(() => {
	vi.useRealTimers();
});

async function startAndReachApproval() {
	transport.createMission.mockResolvedValue(snap("DRAFT", 1));
	transport.executeMission.mockResolvedValue(snap("RUNNING", 3));
	transport.getMission.mockResolvedValue(
		snap("AWAITING_APPROVAL", 4, { proposal }),
	);

	const hook = renderHook(() => useAccountingMission());
	await act(async () => {
		const running = hook.result.current.run(command);
		await vi.advanceTimersByTimeAsync(MISSION_POLL_INTERVAL_MS);
		await running;
	});
	return hook;
}

describe("useAccountingMission against the missions API", () => {
	it("creates the mission, executes it with the server's version and follows it", async () => {
		const { result } = await startAndReachApproval();

		expect(transport.createMission).toHaveBeenCalledWith(command);
		expect(transport.executeMission).toHaveBeenCalledWith(ID, {
			expectedMissionVersion: 1,
		});
		expect(transport.getMission).toHaveBeenCalledWith(ID);
		expect(result.current.status).toBe("AWAITING_APPROVAL");
		expect(result.current.version).toBe(4);
		expect(result.current.isAwaiting).toBe(true);
	});

	it("ignores a second start while the first one is still in flight", async () => {
		let release: (snapshot: unknown) => void = () => undefined;
		transport.createMission.mockReturnValue(
			new Promise((resolve) => {
				release = resolve;
			}),
		);
		transport.executeMission.mockResolvedValue(
			snap("AWAITING_APPROVAL", 3, { proposal }),
		);
		const { result } = renderHook(() => useAccountingMission());

		await act(async () => {
			const first = result.current.run(command);
			const second = result.current.run(command);
			release(snap("DRAFT", 1));
			await Promise.all([first, second]);
		});

		expect(transport.createMission).toHaveBeenCalledTimes(1);
		expect(transport.executeMission).toHaveBeenCalledTimes(1);
	});

	it("allows starting again after a start that failed", async () => {
		transport.createMission
			.mockRejectedValueOnce(new Error("sin conexión"))
			.mockResolvedValueOnce(snap("DRAFT", 1));
		transport.executeMission.mockResolvedValue(
			snap("AWAITING_APPROVAL", 3, { proposal }),
		);
		const { result } = renderHook(() => useAccountingMission());

		await act(async () => {
			await result.current.run(command);
		});
		expect(result.current.status).toBe("FAILED");

		await act(async () => {
			await result.current.run(command);
		});
		expect(transport.createMission).toHaveBeenCalledTimes(2);
		expect(result.current.status).toBe("AWAITING_APPROVAL");
	});

	it("approves with the current server version and shows the server's receipt", async () => {
		const { result } = await startAndReachApproval();
		transport.approveMission.mockResolvedValue(
			snap("APPROVED", 5, { receiptId: "r-1", receiptHash: "h-1" }),
		);

		await act(async () => {
			await result.current.approve();
		});

		expect(transport.approveMission).toHaveBeenCalledWith(ID, {
			proposalId: proposal.id,
			proposalVersion: 1,
			evidenceHash: proposal.evidenceHash,
			expectedMissionVersion: 4,
		});
		expect(result.current.status).toBe("APPROVED");
		expect(result.current.receiptId).toBe("r-1");
	});

	it("takes the rejection from the server, not a made-up 'current-user'", async () => {
		const { result } = await startAndReachApproval();
		const rejection = {
			reason: "Faltan sustentos",
			rejectedBy: "user-7",
			rejectedAt: "2026-10-20T10:00:00.000Z",
			proposalVersion: 1,
		};
		transport.rejectMission.mockResolvedValue(
			snap("REJECTED", 5, { rejection }),
		);

		await act(async () => {
			await result.current.reject("Faltan sustentos");
		});

		expect(transport.rejectMission).toHaveBeenCalledWith(
			ID,
			expect.objectContaining({ expectedMissionVersion: 4 }),
		);
		expect(result.current.rejection).toEqual(rejection);
	});

	it("resumes the period's existing mission instead of failing", async () => {
		transport.createMission.mockRejectedValue({
			code: "MISSION_STATE_CONFLICT",
			message: "Ya existe una misión para este periodo",
			statusCode: 409,
			details: { missionId: ID, status: "AWAITING_APPROVAL" },
			isTimeout: false,
		});
		transport.getMission.mockResolvedValue(
			snap("AWAITING_APPROVAL", 4, { proposal }),
		);
		const { result } = renderHook(() => useAccountingMission());

		await act(async () => {
			await result.current.run(command);
		});

		expect(transport.getMission).toHaveBeenCalledWith(ID);
		expect(transport.executeMission).not.toHaveBeenCalled();
		expect(result.current.status).toBe("AWAITING_APPROVAL");
		expect(result.current.isAwaiting).toBe(true);
	});

	it("runs an existing mission that never started", async () => {
		transport.createMission.mockRejectedValue({
			code: "MISSION_STATE_CONFLICT",
			message: "Ya existe una misión para este periodo",
			statusCode: 409,
			details: { missionId: ID, status: "DRAFT" },
			isTimeout: false,
		});
		transport.getMission.mockResolvedValueOnce(snap("DRAFT", 2));
		transport.executeMission.mockResolvedValue(
			snap("AWAITING_APPROVAL", 4, { proposal }),
		);
		const { result } = renderHook(() => useAccountingMission());

		await act(async () => {
			await result.current.run(command);
		});

		expect(transport.executeMission).toHaveBeenCalledWith(ID, {
			expectedMissionVersion: 2,
		});
		expect(result.current.status).toBe("AWAITING_APPROVAL");
	});

	it("shows the API's error when the mission cannot be created", async () => {
		transport.createMission.mockRejectedValue({
			code: "UNAUTHORIZED",
			message: "No autorizado",
			statusCode: 401,
			isTimeout: false,
		});
		const { result } = renderHook(() => useAccountingMission());

		await act(async () => {
			await result.current.run(command);
		});

		expect(transport.executeMission).not.toHaveBeenCalled();
		expect(result.current.error).toBe("No autorizado");
	});
});
