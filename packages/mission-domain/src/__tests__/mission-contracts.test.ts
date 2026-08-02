import { describe, expect, it } from "vitest";
import type { MissionSnapshot } from "../mission-contracts.js";

describe("MissionSnapshot", () => {
	it("should include lastEventSequence field", () => {
		const snapshot: MissionSnapshot = {
			id: "m1",
			companyId: "c1",
			fiscalPeriod: "2026-07",
			intent: "monthly-close",
			status: "DRAFT" as never,
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
			createdAt: "2026-07-01T00:00:00Z",
			updatedAt: "2026-07-01T00:00:00Z",
		};
		expect(snapshot.lastEventSequence).toBe(0);
		expect(snapshot.fiscalPeriod).toMatch(/^\d{4}-\d{2}$/);
	});
});
