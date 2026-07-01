import { describe, expect, it } from "vitest";

type CloseStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "VERIFIED"
	| "LOCKED";
type ItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "WAIVED";
type GateStatus = "OPEN" | "PASSED" | "FAILED" | "WAIVED";
type GateType =
	| "open_prs"
	| "unverified_evidence"
	| "bank_not_reconciled"
	| "missing_depreciation"
	| "pending_tax"
	| "prior_period_unlocked";
type ChecklistCategory =
	| "bank_reconciliation"
	| "depreciation"
	| "tax_provision"
	| "accrual"
	| "deferral"
	| "inventory"
	| "intercompany"
	| "other";

const VALID_TRANSITIONS: Record<CloseStatus, CloseStatus[]> = {
	PENDING: ["IN_PROGRESS"],
	IN_PROGRESS: ["COMPLETED"],
	COMPLETED: ["VERIFIED"],
	VERIFIED: ["LOCKED"],
	LOCKED: [],
};

function transitionChecklist(from: CloseStatus, to: CloseStatus): void {
	const allowed = VALID_TRANSITIONS[from];
	if (!allowed.includes(to)) {
		throw new Error(
			`Cannot transition from ${from} to ${to}. Allowed: ${allowed.join(", ") || "none"}`,
		);
	}
}

function calculateProgress(status: CloseStatus): number {
	switch (status) {
		case "PENDING":
			return 0;
		case "IN_PROGRESS":
			return 25;
		case "COMPLETED":
			return 100;
		case "VERIFIED":
			return 100;
		case "LOCKED":
			return 100;
	}
}

const VALID_ITEM_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
	PENDING: ["IN_PROGRESS", "WAIVED"],
	IN_PROGRESS: ["COMPLETED"],
	COMPLETED: [],
	WAIVED: [],
};

function transitionItem(from: ItemStatus, to: ItemStatus): void {
	const allowed = VALID_ITEM_TRANSITIONS[from];
	if (!allowed.includes(to)) {
		throw new Error(
			`Cannot transition item from ${from} to ${to}. Allowed: ${allowed.join(", ") || "none"}`,
		);
	}
}

const VALID_GATE_TRANSITIONS: Record<GateStatus, GateStatus[]> = {
	OPEN: ["PASSED", "FAILED", "WAIVED"],
	PASSED: [],
	FAILED: [],
	WAIVED: [],
};

function transitionGate(
	from: GateStatus,
	to: GateStatus,
	resolution?: string,
): void {
	const allowed = VALID_GATE_TRANSITIONS[from];
	if (!allowed.includes(to)) {
		throw new Error(
			`Cannot transition gate from ${from} to ${to}. Allowed: ${allowed.join(", ") || "none"}`,
		);
	}
	if (to === "FAILED" && !resolution) {
		throw new Error("A failed gate requires a resolution description");
	}
}

describe("Monthly Close Checklist", () => {
	describe("Status transitions", () => {
		it("should transition PENDING -> IN_PROGRESS", () => {
			expect(() => transitionChecklist("PENDING", "IN_PROGRESS")).not.toThrow();
		});

		it("should transition IN_PROGRESS -> COMPLETED", () => {
			expect(() =>
				transitionChecklist("IN_PROGRESS", "COMPLETED"),
			).not.toThrow();
		});

		it("should transition COMPLETED -> VERIFIED", () => {
			expect(() => transitionChecklist("COMPLETED", "VERIFIED")).not.toThrow();
		});

		it("should transition VERIFIED -> LOCKED", () => {
			expect(() => transitionChecklist("VERIFIED", "LOCKED")).not.toThrow();
		});

		it("should reject PENDING -> LOCKED skipping all intermediate steps", () => {
			expect(() => transitionChecklist("PENDING", "LOCKED")).toThrow(
				"Cannot transition from PENDING to LOCKED",
			);
		});

		it("should reject PENDING -> COMPLETED skipping IN_PROGRESS", () => {
			expect(() => transitionChecklist("PENDING", "COMPLETED")).toThrow(
				"Cannot transition from PENDING to COMPLETED",
			);
		});

		it("should reject IN_PROGRESS -> LOCKED skipping COMPLETED and VERIFIED", () => {
			expect(() => transitionChecklist("IN_PROGRESS", "LOCKED")).toThrow(
				"Cannot transition from IN_PROGRESS to LOCKED",
			);
		});

		it("should reject COMPLETED -> IN_PROGRESS (backwards)", () => {
			expect(() => transitionChecklist("COMPLETED", "IN_PROGRESS")).toThrow(
				"Cannot transition from COMPLETED to IN_PROGRESS",
			);
		});

		it("should reject LOCKED -> any (locked is terminal)", () => {
			expect(() => transitionChecklist("LOCKED", "VERIFIED")).toThrow(
				"Cannot transition from LOCKED to VERIFIED",
			);
		});
	});

	describe("Progress calculation", () => {
		it("should be 0 when PENDING", () => {
			expect(calculateProgress("PENDING")).toBe(0);
		});

		it("should be 25 when IN_PROGRESS", () => {
			expect(calculateProgress("IN_PROGRESS")).toBe(25);
		});

		it("should be 100 when COMPLETED", () => {
			expect(calculateProgress("COMPLETED")).toBe(100);
		});

		it("should be 100 when VERIFIED", () => {
			expect(calculateProgress("VERIFIED")).toBe(100);
		});

		it("should be 100 when LOCKED", () => {
			expect(calculateProgress("LOCKED")).toBe(100);
		});
	});

	describe("Full lifecycle", () => {
		it("should complete the PENDING -> LOCKED cycle step by step", () => {
			let status: CloseStatus = "PENDING";
			expect(calculateProgress(status)).toBe(0);

			transitionChecklist(status, "IN_PROGRESS");
			status = "IN_PROGRESS";
			expect(calculateProgress(status)).toBe(25);

			transitionChecklist(status, "COMPLETED");
			status = "COMPLETED";
			expect(calculateProgress(status)).toBe(100);

			transitionChecklist(status, "VERIFIED");
			status = "VERIFIED";
			expect(calculateProgress(status)).toBe(100);

			transitionChecklist(status, "LOCKED");
			status = "LOCKED";
			expect(calculateProgress(status)).toBe(100);
		});
	});
});

describe("Close Checklist Item", () => {
	describe("Status transitions", () => {
		it("should transition PENDING -> IN_PROGRESS", () => {
			expect(() => transitionItem("PENDING", "IN_PROGRESS")).not.toThrow();
		});

		it("should transition PENDING -> WAIVED", () => {
			expect(() => transitionItem("PENDING", "WAIVED")).not.toThrow();
		});

		it("should transition IN_PROGRESS -> COMPLETED", () => {
			expect(() => transitionItem("IN_PROGRESS", "COMPLETED")).not.toThrow();
		});

		it("should reject PENDING -> COMPLETED skipping IN_PROGRESS", () => {
			expect(() => transitionItem("PENDING", "COMPLETED")).toThrow(
				"Cannot transition item from PENDING to COMPLETED",
			);
		});

		it("should reject WAIVED -> IN_PROGRESS (waived is terminal)", () => {
			expect(() => transitionItem("WAIVED", "IN_PROGRESS")).toThrow(
				"Cannot transition item from WAIVED to IN_PROGRESS",
			);
		});

		it("should reject COMPLETED -> WAIVED (completed is terminal)", () => {
			expect(() => transitionItem("COMPLETED", "WAIVED")).toThrow(
				"Cannot transition item from COMPLETED to WAIVED",
			);
		});

		it("should reject COMPLETED -> IN_PROGRESS (no backwards)", () => {
			expect(() => transitionItem("COMPLETED", "IN_PROGRESS")).toThrow(
				"Cannot transition item from COMPLETED to IN_PROGRESS",
			);
		});

		it("should reject WAIVED -> COMPLETED (no backwards from waived)", () => {
			expect(() => transitionItem("WAIVED", "COMPLETED")).toThrow(
				"Cannot transition item from WAIVED to COMPLETED",
			);
		});
	});
});

describe("Close Gate", () => {
	describe("Status transitions", () => {
		it("should transition OPEN -> PASSED", () => {
			expect(() => transitionGate("OPEN", "PASSED")).not.toThrow();
		});

		it("should transition OPEN -> FAILED with resolution", () => {
			expect(() =>
				transitionGate("OPEN", "FAILED", "Missing bank statement"),
			).not.toThrow();
		});

		it("should transition OPEN -> WAIVED", () => {
			expect(() => transitionGate("OPEN", "WAIVED")).not.toThrow();
		});

		it("should reject OPEN -> FAILED without resolution", () => {
			expect(() => transitionGate("OPEN", "FAILED")).toThrow(
				"A failed gate requires a resolution description",
			);
		});

		it("should reject PASSED -> FAILED (passed is terminal)", () => {
			expect(() => transitionGate("PASSED", "FAILED")).toThrow(
				"Cannot transition gate from PASSED to FAILED",
			);
		});

		it("should reject FAILED -> PASSED (failed is terminal)", () => {
			expect(() => transitionGate("FAILED", "PASSED")).toThrow(
				"Cannot transition gate from FAILED to PASSED",
			);
		});

		it("should reject WAIVED -> OPEN (waived is terminal)", () => {
			expect(() => transitionGate("WAIVED", "OPEN")).toThrow(
				"Cannot transition gate from WAIVED to OPEN",
			);
		});
	});
});
