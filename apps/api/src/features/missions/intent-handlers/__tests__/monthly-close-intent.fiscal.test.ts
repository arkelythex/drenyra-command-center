/**
 * MonthlyCloseIntentHandler fiscal recording — unit tests.
 *
 * Verifies the best-effort contract: recording fiscal memory after an
 * approved proposal NEVER breaks the mission flow.
 */

import type { MonthlyCloseOrchestrator } from "@drenyra/application/use-cases/monthly-close";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FiscalMemoryRecorder } from "../fiscal-memory.recorder";
import { MonthlyCloseIntentHandler } from "../monthly-close-intent.handler";

function makeOrchestrator() {
	return {
		execute: vi.fn().mockResolvedValue({ status: "COMPLETED" }),
		applyEntries: vi.fn().mockResolvedValue({ ok: true }),
	} as unknown as MonthlyCloseOrchestrator;
}

function makeRecorder() {
	return {
		recordApprovedProposal: vi.fn().mockResolvedValue(undefined),
	} as FiscalMemoryRecorder;
}

/** db stub whose select().from().where().limit() returns the mission row. */
function makeDb(proposal: unknown) {
	let chain: Record<string, unknown>;
	chain = {
		limit: vi.fn().mockResolvedValue([{ proposal }]),
		where: vi.fn().mockImplementation(() => chain),
		from: vi.fn().mockImplementation(() => chain),
		select: vi.fn().mockImplementation(() => chain),
	};
	return chain as never;
}

const missionId = "550e8400-e29b-41d4-a716-446655440001";
const companyId = "550e8400-e29b-41d4-a716-446655440000";
const PROPOSAL = { id: "prop-1", riskLevel: "HIGH" };

describe("MonthlyCloseIntentHandler.onApproved (fiscal recording)", () => {
	let orchestrator: ReturnType<typeof makeOrchestrator>;
	let recorder: ReturnType<typeof makeRecorder>;

	beforeEach(() => {
		vi.clearAllMocks();
		orchestrator = makeOrchestrator();
		recorder = makeRecorder();
	});

	it("applies entries and records the approved proposal", async () => {
		const db = makeDb(PROPOSAL);
		const handler = new MonthlyCloseIntentHandler(orchestrator, db, recorder);

		await handler.onApproved(missionId, companyId);

		expect(orchestrator.applyEntries).toHaveBeenCalledWith(
			missionId,
			companyId,
		);
		expect(recorder.recordApprovedProposal).toHaveBeenCalledWith({
			missionId,
			companyId,
			proposal: PROPOSAL,
			approvedBy: "system",
		});
	});

	it("recorder failure never breaks the mission flow (warning, no throw)", async () => {
		recorder.recordApprovedProposal = vi
			.fn()
			.mockRejectedValue(new Error("ENGINE_UNREACHABLE"));
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const db = makeDb(PROPOSAL);
		const handler = new MonthlyCloseIntentHandler(orchestrator, db, recorder);

		await expect(
			handler.onApproved(missionId, companyId),
		).resolves.toBeUndefined();
		expect(orchestrator.applyEntries).toHaveBeenCalled();
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("skips recording when no proposal is on the mission (warning)", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const db = makeDb(null);
		const handler = new MonthlyCloseIntentHandler(orchestrator, db, recorder);

		await handler.onApproved(missionId, companyId);

		expect(recorder.recordApprovedProposal).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("does nothing extra when no recorder is injected", async () => {
		const db = makeDb(PROPOSAL);
		const handler = new MonthlyCloseIntentHandler(orchestrator, db);

		await handler.onApproved(missionId, companyId);

		expect(orchestrator.applyEntries).toHaveBeenCalled();
	});
});
