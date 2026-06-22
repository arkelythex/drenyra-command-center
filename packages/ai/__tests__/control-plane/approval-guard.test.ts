import { describe, expect, it } from "vitest";
import {
	buildDeterministicHandoff,
	evaluateApprovalApplyGuard,
} from "../../src/control-plane/approval-guard";

describe("approval apply guard", () => {
	it("rejects apply when approval is rejected or pending", () => {
		const pending = evaluateApprovalApplyGuard({
			approvalState: "validated",
			decisionAllowed: true,
		});

		expect(pending.allowed).toBe(false);
		expect(pending.code).toBe("APPROVAL_PENDING");

		const rejected = evaluateApprovalApplyGuard({
			approvalState: "rejected",
			decisionAllowed: true,
		});

		expect(rejected.allowed).toBe(false);
		expect(rejected.code).toBe("APPROVAL_REJECTED");
	});

	it("allows deterministic handoff only when approved and policy allows", () => {
		const deniedByPolicy = evaluateApprovalApplyGuard({
			approvalState: "approved",
			decisionAllowed: false,
		});

		expect(deniedByPolicy.allowed).toBe(false);
		expect(deniedByPolicy.code).toBe("POLICY_BLOCKED");

		const allowed = evaluateApprovalApplyGuard({
			approvalState: "approved",
			decisionAllowed: true,
		});

		expect(allowed.allowed).toBe(true);
		expect(allowed.code).toBe("OK");

		const handoff = buildDeterministicHandoff("approval-1");
		expect(handoff).toEqual({
			approvalId: "approval-1",
			deterministicCommandReady: true,
			handoffMode: "deterministic-command",
			executeModelOutputAsTruth: false,
			authoritativeMutationAllowed: false,
		});
	});
});
