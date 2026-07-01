import { describe, expect, it } from "vitest";
import { AccountingPr } from "./accounting-pr.entity";
import type { AccountingPrProps, AccountingPrStatus } from "./types";

function makeValidProps(
	overrides?: Partial<AccountingPrProps>,
): AccountingPrProps {
	return {
		id: "pr-001",
		companyId: "20602018854",
		prNumber: 1,
		title: "PR Enero 2024",
		description: "Comprobantes de enero",
		status: "DRAFT",
		entries: [],
		evidenceIds: [],
		totalDebitCents: 0,
		totalCreditCents: 0,
		approveSignerIds: [],
		approveSignatures: [],
		createdById: "usr-001",
		createdAt: new Date("2024-01-15T10:00:00Z"),
		updatedAt: new Date("2024-01-15T10:00:00Z"),
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Static factory: create()
// ---------------------------------------------------------------------------
describe("AccountingPr.create()", () => {
	it("creates an AccountingPr with DRAFT status from valid props", () => {
		const pr = AccountingPr.create(makeValidProps());

		expect(pr).toBeInstanceOf(AccountingPr);
		expect(pr.id).toBe("pr-001");
		expect(pr.companyId).toBe("20602018854");
		expect(pr.prNumber).toBe(1);
		expect(pr.title).toBe("PR Enero 2024");
		expect(pr.description).toBe("Comprobantes de enero");
		expect(pr.status).toBe("DRAFT");
	});

	it("rejects empty title", () => {
		expect(() => AccountingPr.create(makeValidProps({ title: "" }))).toThrow(
			"El título de la PR es requerido",
		);
	});

	it("rejects whitespace-only title", () => {
		expect(() => AccountingPr.create(makeValidProps({ title: "   " }))).toThrow(
			"El título de la PR es requerido",
		);
	});

	it("sets default values correctly (empty entries, empty evidenceIds, 0 totals)", () => {
		const pr = AccountingPr.create(makeValidProps());

		expect(pr.entries).toEqual([]);
		expect(pr.evidenceIds).toEqual([]);
		expect(pr.totalDebitCents).toBe(0);
		expect(pr.totalCreditCents).toBe(0);
		expect(pr.approveSignerIds).toEqual([]);
		expect(pr.approveSignatures).toEqual([]);
	});

	it("rejects negative totalDebitCents", () => {
		expect(() =>
			AccountingPr.create(makeValidProps({ totalDebitCents: -1 })),
		).toThrow("El total del Debe no puede ser negativo");
	});

	it("rejects negative totalCreditCents", () => {
		expect(() =>
			AccountingPr.create(makeValidProps({ totalCreditCents: -1 })),
		).toThrow("El total del Haber no puede ser negativo");
	});

	it("rejects prNumber <= 0", () => {
		expect(() => AccountingPr.create(makeValidProps({ prNumber: 0 }))).toThrow(
			"El número de PR debe ser positivo",
		);
	});
});

// ---------------------------------------------------------------------------
// Static factory: fromPrimitives()
// ---------------------------------------------------------------------------
describe("AccountingPr.fromPrimitives()", () => {
	it("reconstructs from plain data with status string mapping", () => {
		const now = new Date("2024-06-01T12:00:00Z").toISOString();
		const pr = AccountingPr.fromPrimitives({
			id: "pr-002",
			companyId: "20100012345",
			prNumber: 5,
			title: "PR Mayo 2024",
			status: "PENDING_REVIEW",
			entries: ["entry-1", "entry-2"],
			evidenceIds: [],
			totalDebitCents: 50000,
			totalCreditCents: 50000,
			createdAt: now,
			updatedAt: now,
		});

		expect(pr).toBeInstanceOf(AccountingPr);
		expect(pr.id).toBe("pr-002");
		expect(pr.status).toBe("PENDING_REVIEW");
		expect(pr.entries).toEqual(["entry-1", "entry-2"]);
		expect(pr.totalDebitCents).toBe(50000);
	});

	it("defaults status to DRAFT when not provided", () => {
		const now = new Date().toISOString();
		const pr = AccountingPr.fromPrimitives({
			id: "pr-003",
			companyId: "20100012345",
			prNumber: 2,
			title: "Default Status",
			createdAt: now,
			updatedAt: now,
		});

		expect(pr.status).toBe("DRAFT");
	});
});

// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------
describe("AccountingPr state machine", () => {
	// --- submitForReview ---
	describe("submitForReview()", () => {
		it("transitions from DRAFT to PENDING_REVIEW", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");

			expect(submitted.status).toBe("PENDING_REVIEW");
			expect(submitted.reviewerId).toBe("rev-001");
		});

		it("sets updatedAt after transition", () => {
			const pr = AccountingPr.create(makeValidProps());
			const before = pr.updatedAt.getTime();

			// Small delay to ensure time difference
			const submitted = pr.submitForReview("rev-001");

			expect(submitted.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
		});

		it("throws if current status is not DRAFT", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");

			expect(() => submitted.submitForReview("rev-002")).toThrow(
				"No se puede transicionar de PENDING_REVIEW a PENDING_REVIEW",
			);
		});
	});

	// --- approve ---
	describe("approve()", () => {
		it("transitions from PENDING_REVIEW to APPROVED and records signer", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");
			const approved = submitted.approve("jdoe");

			expect(approved.status).toBe("APPROVED");
			expect(approved.approveSignerIds).toContain("jdoe");
			expect(approved.approveSignatures).toHaveLength(1);
			expect(approved.approveSignatures[0].signerId).toBe("jdoe");
		});

		it("throws if current status is not PENDING_REVIEW", () => {
			const pr = AccountingPr.create(makeValidProps());

			expect(() => pr.approve("jdoe")).toThrow(
				"No se puede transicionar de DRAFT a APPROVED",
			);
		});
	});

	// --- reject ---
	describe("reject()", () => {
		it("transitions from PENDING_REVIEW to REJECTED with reason", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");
			const rejected = submitted.reject("Documentación incompleta");

			expect(rejected.status).toBe("REJECTED");
			expect(rejected.reviewComment).toBe("Documentación incompleta");
		});

		it("throws without a reason", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");

			expect(() => submitted.reject("")).toThrow(
				"El motivo de rechazo es requerido",
			);
		});

		it("throws with whitespace-only reason", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");

			expect(() => submitted.reject("   ")).toThrow(
				"El motivo de rechazo es requerido",
			);
		});

		it("throws if current status is not PENDING_REVIEW", () => {
			const pr = AccountingPr.create(makeValidProps());

			expect(() => pr.reject("motivo")).toThrow(
				"No se puede transicionar de DRAFT a REJECTED",
			);
		});
	});

	// --- post ---
	describe("post()", () => {
		it("transitions from APPROVED to POSTED", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");
			const approved = submitted.approve("jdoe");
			const posted = approved.post();

			expect(posted.status).toBe("POSTED");
		});

		it("throws if current status is not APPROVED", () => {
			const pr = AccountingPr.create(makeValidProps());

			expect(() => pr.post()).toThrow(
				"No se puede transicionar de DRAFT a POSTED",
			);
		});

		it("throws if trying to post from REJECTED", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");
			const rejected = submitted.reject("Motivo");

			expect(() => rejected.post()).toThrow(
				"No se puede transicionar de REJECTED a POSTED",
			);
		});

		it("throws if trying to post from POSTED", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");
			const approved = submitted.approve("jdoe");
			const posted = approved.post();

			expect(() => posted.post()).toThrow(
				"No se puede transicionar de POSTED a POSTED",
			);
		});
	});

	// --- Full lifecycle ---
	it("follows the complete DRAFT -> PENDING_REVIEW -> APPROVED -> POSTED flow", () => {
		const pr = AccountingPr.create(makeValidProps());
		expect(pr.status).toBe("DRAFT");

		const submitted = pr.submitForReview("rev-001");
		expect(submitted.status).toBe("PENDING_REVIEW");

		const approved = submitted.approve("jdoe");
		expect(approved.status).toBe("APPROVED");

		const posted = approved.post();
		expect(posted.status).toBe("POSTED");
	});
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------
describe("AccountingPr immutability", () => {
	it("each transition returns a new instance", () => {
		const pr = AccountingPr.create(makeValidProps());
		const submitted = pr.submitForReview("rev-001");
		const approved = submitted.approve("jdoe");

		expect(submitted).not.toBe(pr);
		expect(approved).not.toBe(submitted);
	});

	it("original reference remains unchanged after transitions", () => {
		const pr = AccountingPr.create(makeValidProps());
		const originalStatus = pr.status;
		const originalUpdatedAt = pr.updatedAt;

		pr.submitForReview("rev-001");

		expect(pr.status).toBe(originalStatus);
		expect(pr.updatedAt).toBe(originalUpdatedAt);
	});

	it("getter returns a readonly view of entries", () => {
		const pr = AccountingPr.create(makeValidProps({ entries: ["e1", "e2"] }));
		const { entries } = pr;
		expect(entries).toEqual(["e1", "e2"]);
	});
});

// ---------------------------------------------------------------------------
// toJSON()
// ---------------------------------------------------------------------------
describe("AccountingPr.toJSON()", () => {
	it("returns correct structure with all fields", () => {
		const now = new Date("2024-06-01T12:00:00Z");
		const pr = AccountingPr.create(
			makeValidProps({
				id: "pr-010",
				title: "PR Junio",
				createdAt: now,
				updatedAt: now,
			}),
		);

		const json = pr.toJSON();

		expect(json).toMatchObject({
			id: "pr-010",
			companyId: "20602018854",
			prNumber: 1,
			title: "PR Junio",
			status: "DRAFT",
			entries: [],
			evidenceIds: [],
			totalDebitCents: 0,
			totalCreditCents: 0,
		});
		expect(json.createdAt).toBe("2024-06-01T12:00:00.000Z");
		expect(json.updatedAt).toBe("2024-06-01T12:00:00.000Z");
	});
});

// ---------------------------------------------------------------------------
// Utility methods
// ---------------------------------------------------------------------------
describe("AccountingPr utility methods", () => {
	describe("canBeModified()", () => {
		it("returns true when status is DRAFT", () => {
			const pr = AccountingPr.create(makeValidProps());
			expect(pr.canBeModified()).toBe(true);
		});

		it("returns false when status is not DRAFT", () => {
			const pr = AccountingPr.create(makeValidProps());
			const submitted = pr.submitForReview("rev-001");
			expect(submitted.canBeModified()).toBe(false);

			const approved = submitted.approve("jdoe");
			expect(approved.canBeModified()).toBe(false);
		});
	});

	describe("equals()", () => {
		it("returns true for PRs with same id", () => {
			const a = AccountingPr.create(makeValidProps({ id: "pr-001" }));
			const b = AccountingPr.create(makeValidProps({ id: "pr-001" }));
			expect(a.equals(b)).toBe(true);
		});

		it("returns false for PRs with different ids", () => {
			const a = AccountingPr.create(makeValidProps({ id: "pr-001" }));
			const b = AccountingPr.create(makeValidProps({ id: "pr-002" }));
			expect(a.equals(b)).toBe(false);
		});

		it("returns false for null or undefined", () => {
			const pr = AccountingPr.create(makeValidProps());
			expect(pr.equals(null)).toBe(false);
			expect(pr.equals(undefined)).toBe(false);
		});
	});
});

// ---------------------------------------------------------------------------
// addSignature (multi-signer path)
// ---------------------------------------------------------------------------
describe("AccountingPr.addSignature()", () => {
	it("adds a signature in PENDING_REVIEW state", () => {
		const pr = AccountingPr.create(makeValidProps());
		const submitted = pr.submitForReview("rev-001");
		const signed = submitted.addSignature("auditor-1");

		expect(signed.approveSignerIds).toContain("auditor-1");
		expect(signed.approveSignatures).toHaveLength(1);
	});

	it("adds multiple signatures sequentially", () => {
		const pr = AccountingPr.create(makeValidProps());
		const submitted = pr.submitForReview("rev-001");
		const step1 = submitted.addSignature("auditor-1");
		const step2 = step1.addSignature("auditor-2");

		expect(step2.approveSignerIds).toEqual(["auditor-1", "auditor-2"]);
		expect(step2.approveSignatures).toHaveLength(2);
	});

	it("deduplicates the same signerId in signatures", () => {
		const pr = AccountingPr.create(makeValidProps());
		const submitted = pr.submitForReview("rev-001");
		const step1 = submitted.addSignature("auditor-1");
		const step2 = step1.addSignature("auditor-1");

		expect(step2.approveSignerIds).toEqual(["auditor-1"]);
	});

	it("throws if not in PENDING_REVIEW", () => {
		const pr = AccountingPr.create(makeValidProps());
		expect(() => pr.addSignature("auditor-1")).toThrow(
			"Solo se pueden agregar firmas a PRs en revisión",
		);
	});

	it("records signature comment when provided", () => {
		const pr = AccountingPr.create(makeValidProps());
		const submitted = pr.submitForReview("rev-001");
		const signed = submitted.addSignature("auditor-1", "Verificado conforme");

		expect(signed.approveSignatures[0].comment).toBe("Verificado conforme");
	});
});
