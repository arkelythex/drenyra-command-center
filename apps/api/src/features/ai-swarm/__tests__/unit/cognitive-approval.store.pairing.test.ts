import { describe, expect, it } from "vitest";
import { CognitiveApprovalStore } from "../../api/cognitive-approval.store";
import { createApprovalPairing } from "../../api/cognitive-approval-pairing";

describe("CognitiveApprovalStore pairing validation", () => {
	it("requires a valid pairing code to approve critical tool calls", async () => {
		const store = new CognitiveApprovalStore();
		const runId = "run-pairing-1";
		const toolCallId = "tool-pairing-1";
		const pairing = createApprovalPairing(runId, toolCallId);

		const decisionPromise = store.createAndWait(
			{
				runId,
				toolCallId,
				name: "crear_asiento",
				args: { amount: 118 },
				requestedAt: new Date().toISOString(),
				pairingRequired: true,
				pairingSessionId: pairing.metadata.sessionId,
				pairingHint: pairing.metadata.hint,
				pairingChallenge: pairing.metadata.challenge,
				pairingCodeHash: pairing.metadata.codeHash,
			},
			1000,
		);

		const missingCode = store.resolve(runId, toolCallId, true);
		expect(missingCode).toEqual({ ok: false, code: "pairing_required" });

		const invalidCode = store.resolve(runId, toolCallId, true, {
			pairingCode: "000000",
		});
		expect(invalidCode).toEqual({ ok: false, code: "pairing_invalid" });

		const accepted = store.resolve(runId, toolCallId, true, {
			pairingCode: pairing.code,
		});
		expect(accepted).toEqual({ ok: true, code: "resolved" });

		const decision = await decisionPromise;
		expect(decision).toEqual({ approved: true, resolution: "approved" });
	});

	it("allows reject decisions without pairing code", async () => {
		const store = new CognitiveApprovalStore();
		const runId = "run-pairing-2";
		const toolCallId = "tool-pairing-2";
		const pairing = createApprovalPairing(runId, toolCallId);

		const decisionPromise = store.createAndWait(
			{
				runId,
				toolCallId,
				name: "crear_asiento",
				args: { amount: 500 },
				requestedAt: new Date().toISOString(),
				pairingRequired: true,
				pairingSessionId: pairing.metadata.sessionId,
				pairingHint: pairing.metadata.hint,
				pairingChallenge: pairing.metadata.challenge,
				pairingCodeHash: pairing.metadata.codeHash,
			},
			1000,
		);

		const rejected = store.resolve(runId, toolCallId, false);
		expect(rejected).toEqual({ ok: true, code: "resolved" });

		const decision = await decisionPromise;
		expect(decision).toEqual({ approved: false, resolution: "rejected" });
	});
});
