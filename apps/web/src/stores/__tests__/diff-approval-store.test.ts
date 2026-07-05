import { beforeEach, describe, expect, it } from "vitest";
import type { ApprovalRequest, DiffFile } from "../diff-approval-store";
import { useDiffApprovalStore } from "../diff-approval-store";

function createMockApprovalRequest(
	overrides?: Partial<ApprovalRequest>,
): ApprovalRequest {
	return {
		id: "req-1",
		action: "Modificar asiento contable",
		description: "Modificar cuenta 10 por 70",
		riskLevel: "medium",
		filesChanged: ["asientos/001.txt"],
		timestamp: "2026-04-15T10:00:00Z",
		status: "pending",
		...overrides,
	};
}

describe("DiffApprovalStore", () => {
	beforeEach(() => {
		useDiffApprovalStore.setState({
			diffFiles: [],
			approvalRequests: [],
		});
	});

	it("should set diff files", () => {
		const files: DiffFile[] = [
			{
				fileName: "test.txt",
				oldText: "old",
				newText: "new",
				status: "modified",
			},
		];
		useDiffApprovalStore.getState().setDiffFiles(files);
		expect(useDiffApprovalStore.getState().diffFiles).toHaveLength(1);
		expect(useDiffApprovalStore.getState().diffFiles[0].fileName).toBe(
			"test.txt",
		);
	});

	it("should add an approval request with pending status", () => {
		const request = createMockApprovalRequest();
		useDiffApprovalStore.getState().addApprovalRequest(request);

		const stored = useDiffApprovalStore.getState().approvalRequests;
		expect(stored).toHaveLength(1);
		expect(stored[0].status).toBe("pending");
		expect(stored[0].riskLevel).toBe("medium");
	});

	it("should resolve an approval request", () => {
		const request = createMockApprovalRequest();
		useDiffApprovalStore.getState().addApprovalRequest(request);

		useDiffApprovalStore.getState().resolveApproval("req-1", "approved");
		expect(useDiffApprovalStore.getState().approvalRequests[0].status).toBe(
			"approved",
		);
	});

	it("should resolve to denied status", () => {
		const request = createMockApprovalRequest();
		useDiffApprovalStore.getState().addApprovalRequest(request);

		useDiffApprovalStore.getState().resolveApproval("req-1", "denied");
		expect(useDiffApprovalStore.getState().approvalRequests[0].status).toBe(
			"denied",
		);
	});

	it("should clear all approvals", () => {
		useDiffApprovalStore
			.getState()
			.addApprovalRequest(createMockApprovalRequest({ id: "req-1" }));
		useDiffApprovalStore
			.getState()
			.addApprovalRequest(createMockApprovalRequest({ id: "req-2" }));

		useDiffApprovalStore.getState().clearApprovals();
		expect(useDiffApprovalStore.getState().approvalRequests).toHaveLength(0);
	});

	it("should not affect other requests when resolving one", () => {
		useDiffApprovalStore
			.getState()
			.addApprovalRequest(createMockApprovalRequest({ id: "req-1" }));
		useDiffApprovalStore
			.getState()
			.addApprovalRequest(createMockApprovalRequest({ id: "req-2" }));

		useDiffApprovalStore.getState().resolveApproval("req-1", "denied");
		const requests = useDiffApprovalStore.getState().approvalRequests;
		expect(requests.find((r) => r.id === "req-1")?.status).toBe("denied");
		expect(requests.find((r) => r.id === "req-2")?.status).toBe("pending");
	});

	it("should handle various risk levels", () => {
		useDiffApprovalStore
			.getState()
			.addApprovalRequest(
				createMockApprovalRequest({ id: "low", riskLevel: "low" }),
			);
		useDiffApprovalStore
			.getState()
			.addApprovalRequest(
				createMockApprovalRequest({ id: "high", riskLevel: "high" }),
			);

		const requests = useDiffApprovalStore.getState().approvalRequests;
		expect(requests.find((r) => r.id === "low")?.riskLevel).toBe("low");
		expect(requests.find((r) => r.id === "high")?.riskLevel).toBe("high");
	});

	it("should not persist to localStorage (no persist middleware)", () => {
		useDiffApprovalStore
			.getState()
			.addApprovalRequest(createMockApprovalRequest());
		useDiffApprovalStore.getState().setDiffFiles([
			{
				fileName: "test.txt",
				oldText: "old",
				newText: "new",
			},
		]);

		// The store has no persist, so no localStorage key should exist for it
		const keys = Object.keys(localStorage);
		const diffApprovalKey = keys.find((k) => k.toLowerCase().includes("diff"));
		expect(diffApprovalKey).toBeUndefined();
	});
});
