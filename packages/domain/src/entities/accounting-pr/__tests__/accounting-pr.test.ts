import { describe, it, expect } from "vitest";
import { AccountingPr } from "../accounting-pr.entity";
import type { AccountingPrProps } from "../types";

function makeProps(overrides: Partial<AccountingPrProps> = {}): AccountingPrProps {
	return {
		id: "pr-001",
		companyId: "company-1",
		prNumber: 1,
		title: "Test PR",
		description: "A test PR",
		status: "DRAFT",
		entries: ["entry-1"],
		evidenceIds: ["ev-1"],
		totalDebitCents: 1000,
		totalCreditCents: 1000,
		reviewerId: undefined,
		reviewedAt: undefined,
		reviewComment: undefined,
		approveSignerIds: [],
		approveSignatures: [],
		createdById: "user-1",
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

describe("AccountingPr", () => {
	describe("create()", () => {
		it("creates a PR with DRAFT status by default", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			expect(pr.status).toBe("DRAFT");
			expect(pr.id).toBe("pr-001");
			expect(pr.title).toBe("Test PR");
		});

		it("accepts DRAFT status explicitly", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			expect(pr.status).toBe("DRAFT");
		});

		it("accepts any valid status", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			expect(pr.status).toBe("PENDING_REVIEW");
		});

		it("throws if title is empty", () => {
			expect(() =>
				AccountingPr.create(makeProps({ title: "" })),
			).toThrow("El título de la PR es requerido");
		});

		it("throws if title is only whitespace", () => {
			expect(() =>
				AccountingPr.create(makeProps({ title: "   " })),
			).toThrow("El título de la PR es requerido");
		});

		it("throws if prNumber is zero", () => {
			expect(() =>
				AccountingPr.create(makeProps({ prNumber: 0 })),
			).toThrow("El número de PR debe ser positivo");
		});

		it("throws if prNumber is negative", () => {
			expect(() =>
				AccountingPr.create(makeProps({ prNumber: -1 })),
			).toThrow("El número de PR debe ser positivo");
		});

		it("throws if totalDebitCents is negative", () => {
			expect(() =>
				AccountingPr.create(makeProps({ totalDebitCents: -1 })),
			).toThrow("El total del Debe no puede ser negativo");
		});

		it("throws if totalCreditCents is negative", () => {
			expect(() =>
				AccountingPr.create(makeProps({ totalCreditCents: -1 })),
			).toThrow("El total del Haber no puede ser negativo");
		});

		it("allows zero balances", () => {
			const pr = AccountingPr.create(makeProps({ totalDebitCents: 0, totalCreditCents: 0 }));
			expect(pr.totalDebitCents).toBe(0);
			expect(pr.totalCreditCents).toBe(0);
		});

		it("throws if entries is not an array", () => {
			expect(() =>
				AccountingPr.create(makeProps({ entries: undefined as unknown as string[] })),
			).toThrow("Las entradas deben ser un arreglo");
		});

		it("throws if evidenceIds is not an array", () => {
			expect(() =>
				AccountingPr.create(makeProps({ evidenceIds: undefined as unknown as string[] })),
			).toThrow("Los IDs de evidencia deben ser un arreglo");
		});

		it("throws if approveSignerIds is not an array", () => {
			expect(() =>
				AccountingPr.create(makeProps({ approveSignerIds: undefined as unknown as string[] })),
			).toThrow("Los signatarios deben ser un arreglo");
		});

		it("throws if approveSignatures is not an array", () => {
			expect(() =>
				AccountingPr.create(makeProps({ approveSignatures: undefined as unknown as never[] })),
			).toThrow("Las firmas deben ser un arreglo");
		});
	});

	describe("submitForReview()", () => {
		it("transitions DRAFT to PENDING_REVIEW", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			const submitted = pr.submitForReview();
			expect(submitted.status).toBe("PENDING_REVIEW");
		});

		it("allows providing a reviewerId", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			const submitted = pr.submitForReview("reviewer-1");
			expect(submitted.reviewerId).toBe("reviewer-1");
		});

		it("keeps existing reviewerId if not provided", () => {
			const pr = AccountingPr.create(
				makeProps({ status: "DRAFT", reviewerId: "reviewer-1" }),
			);
			const submitted = pr.submitForReview();
			expect(submitted.reviewerId).toBe("reviewer-1");
		});

		it("throws when not in DRAFT status", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			expect(() => pr.submitForReview()).toThrow(
				"No se puede transicionar de PENDING_REVIEW a PENDING_REVIEW",
			);
		});

		it("throws when already APPROVED", () => {
			const pr = AccountingPr.create(makeProps({ status: "APPROVED" }));
			expect(() => pr.submitForReview()).toThrow(
				"No se puede transicionar de APPROVED a PENDING_REVIEW",
			);
		});

		it("throws when already REJECTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "REJECTED" }));
			expect(() => pr.submitForReview()).toThrow(
				"No se puede transicionar de REJECTED a PENDING_REVIEW",
			);
		});

		it("throws when already POSTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "POSTED" }));
			expect(() => pr.submitForReview()).toThrow(
				"No se puede transicionar de POSTED a PENDING_REVIEW",
			);
		});
	});

	describe("approve()", () => {
		it("transitions PENDING_REVIEW to APPROVED", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const approved = pr.approve("reviewer-1");
			expect(approved.status).toBe("APPROVED");
		});

		it("records signerId in approveSignerIds", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const approved = pr.approve("reviewer-1");
			expect(approved.approveSignerIds).toContain("reviewer-1");
		});

		it("creates a signature entry", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const approved = pr.approve("reviewer-1");
			expect(approved.approveSignatures).toHaveLength(1);
			expect(approved.approveSignatures[0].signerId).toBe("reviewer-1");
		});

		it("records a comment when provided", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const approved = pr.approve("reviewer-1", "Looks good");
			expect(approved.reviewComment).toBe("Looks good");
			expect(approved.approveSignatures[0].comment).toBe("Looks good");
		});

		it("sets reviewedAt", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const approved = pr.approve("reviewer-1");
			expect(approved.reviewedAt).toBeInstanceOf(Date);
		});

		it("approve adds signerId to existing signers", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const approved = pr.approve("reviewer-1");
			expect(approved.approveSignerIds).toEqual(["reviewer-1"]);
		});

		it("throws when not in PENDING_REVIEW status", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			expect(() => pr.approve("reviewer-1")).toThrow(
				"No se puede transicionar de DRAFT a APPROVED",
			);
		});

		it("throws when already APPROVED", () => {
			const pr = AccountingPr.create(makeProps({ status: "APPROVED" }));
			expect(() => pr.approve("reviewer-1")).toThrow(
				"No se puede transicionar de APPROVED a APPROVED",
			);
		});

		it("throws when REJECTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "REJECTED" }));
			expect(() => pr.approve("reviewer-1")).toThrow(
				"No se puede transicionar de REJECTED a APPROVED",
			);
		});
	});

	describe("reject()", () => {
		it("transitions PENDING_REVIEW to REJECTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const rejected = pr.reject("Not valid");
			expect(rejected.status).toBe("REJECTED");
		});

		it("stores the rejection reason", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const rejected = pr.reject("Documentation missing");
			expect(rejected.reviewComment).toBe("Documentation missing");
		});

		it("sets reviewedAt", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const rejected = pr.reject("Not valid");
			expect(rejected.reviewedAt).toBeInstanceOf(Date);
		});

		it("throws if reason is empty", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			expect(() => pr.reject("")).toThrow("El motivo de rechazo es requerido");
		});

		it("throws if reason is only whitespace", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			expect(() => pr.reject("   ")).toThrow("El motivo de rechazo es requerido");
		});

		it("throws when not in PENDING_REVIEW status", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			expect(() => pr.reject("reason")).toThrow(
				"No se puede transicionar de DRAFT a REJECTED",
			);
		});

		it("throws when already APPROVED", () => {
			const pr = AccountingPr.create(makeProps({ status: "APPROVED" }));
			expect(() => pr.reject("reason")).toThrow(
				"No se puede transicionar de APPROVED a REJECTED",
			);
		});
	});

	describe("post()", () => {
		it("transitions APPROVED to POSTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "APPROVED" }));
			const posted = pr.post();
			expect(posted.status).toBe("POSTED");
		});

		it("throws when not in APPROVED status", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			expect(() => pr.post()).toThrow(
				"No se puede transicionar de PENDING_REVIEW a POSTED",
			);
		});

		it("throws from DRAFT", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			expect(() => pr.post()).toThrow(
				"No se puede transicionar de DRAFT a POSTED",
			);
		});

		it("throws from POSTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "POSTED" }));
			expect(() => pr.post()).toThrow(
				"No se puede transicionar de POSTED a POSTED",
			);
		});
	});

	describe("addSignature()", () => {
		it("adds a signature in PENDING_REVIEW status", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const signed = pr.addSignature("signer-1");
			expect(signed.approveSignatures).toHaveLength(1);
			expect(signed.approveSignerIds).toContain("signer-1");
		});

		it("throws when not in PENDING_REVIEW", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			expect(() => pr.addSignature("signer-1")).toThrow(
				"Solo se pueden agregar firmas a PRs en revisión",
			);
		});

		it("prevents duplicate signerIds", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const signed = pr.addSignature("signer-1").addSignature("signer-1");
			expect(signed.approveSignerIds).toHaveLength(1);
		});
	});

	describe("canBeModified()", () => {
		it("returns true for DRAFT", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			expect(pr.canBeModified()).toBe(true);
		});

		it("returns false for PENDING_REVIEW", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			expect(pr.canBeModified()).toBe(false);
		});

		it("returns false for APPROVED", () => {
			const pr = AccountingPr.create(makeProps({ status: "APPROVED" }));
			expect(pr.canBeModified()).toBe(false);
		});

		it("returns false for REJECTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "REJECTED" }));
			expect(pr.canBeModified()).toBe(false);
		});

		it("returns false for POSTED", () => {
			const pr = AccountingPr.create(makeProps({ status: "POSTED" }));
			expect(pr.canBeModified()).toBe(false);
		});
	});

	describe("equals()", () => {
		it("returns true for same id", () => {
			const a = AccountingPr.create(makeProps({ id: "pr-1" }));
			const b = AccountingPr.create(makeProps({ id: "pr-1" }));
			expect(a.equals(b)).toBe(true);
		});

		it("returns false for different id", () => {
			const a = AccountingPr.create(makeProps({ id: "pr-1" }));
			const b = AccountingPr.create(makeProps({ id: "pr-2" }));
			expect(a.equals(b)).toBe(false);
		});

		it("returns false for null or undefined", () => {
			const a = AccountingPr.create(makeProps({ id: "pr-1" }));
			expect(a.equals(null)).toBe(false);
			expect(a.equals(undefined)).toBe(false);
		});
	});

	describe("fromPrimitives()", () => {
		it("reconstructs a PR from raw data", () => {
			const data = {
				id: "pr-001",
				companyId: "company-1",
				prNumber: 1,
				title: "Test",
				description: "Desc",
				status: "DRAFT",
				entries: ["e1"],
				evidenceIds: ["ev1"],
				totalDebitCents: 500,
				totalCreditCents: 500,
				reviewerId: undefined,
				reviewedAt: undefined,
				reviewComment: undefined,
				approveSignerIds: [],
				approveSignatures: [],
				createdById: "user-1",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-01T00:00:00.000Z",
			};
			const pr = AccountingPr.fromPrimitives(data);
			expect(pr.id).toBe("pr-001");
			expect(pr.title).toBe("Test");
			expect(pr.status).toBe("DRAFT");
		});

		it("defaults status to DRAFT", () => {
			const pr = AccountingPr.fromPrimitives({
				id: "pr-1",
				companyId: "c-1",
				prNumber: 1,
				title: "Test",
				entries: [],
				evidenceIds: [],
				totalDebitCents: 0,
				totalCreditCents: 0,
				approveSignerIds: [],
				approveSignatures: [],
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-01T00:00:00.000Z",
			});
			expect(pr.status).toBe("DRAFT");
		});

		it("defaults entries and evidenceIds to empty arrays", () => {
			const pr = AccountingPr.fromPrimitives({
				id: "pr-1",
				companyId: "c-1",
				prNumber: 1,
				title: "Test",
				totalDebitCents: 0,
				totalCreditCents: 0,
				approveSignerIds: [],
				approveSignatures: [],
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-01T00:00:00.000Z",
			});
			expect(pr.entries).toEqual([]);
			expect(pr.evidenceIds).toEqual([]);
		});

		it("parses Date fields correctly", () => {
			const pr = AccountingPr.fromPrimitives({
				id: "pr-1",
				companyId: "c-1",
				prNumber: 1,
				title: "Test",
				entries: [],
				evidenceIds: [],
				totalDebitCents: 0,
				totalCreditCents: 0,
				approveSignerIds: [],
				approveSignatures: [],
				createdAt: "2026-06-15T10:30:00.000Z",
				updatedAt: "2026-06-15T10:30:00.000Z",
			});
			expect(pr.createdAt.toISOString()).toBe("2026-06-15T10:30:00.000Z");
		});
	});

	describe("toJSON()", () => {
		it("returns correct structure", () => {
			const pr = AccountingPr.create(makeProps());
			const json = pr.toJSON();

			expect(json.id).toBe("pr-001");
			expect(json.title).toBe("Test PR");
			expect(json.status).toBe("DRAFT");
			expect(json.createdAt).toBe("2026-01-01T00:00:00.000Z");
			expect(json.updatedAt).toBe("2026-01-01T00:00:00.000Z");
		});

		it("serializes dates as ISO strings", () => {
			const pr = AccountingPr.create(makeProps());
			const json = pr.toJSON();
			expect(typeof json.createdAt).toBe("string");
			expect(typeof json.updatedAt).toBe("string");
		});

		it("includes undefined optional fields as undefined", () => {
			const pr = AccountingPr.create(makeProps());
			const json = pr.toJSON();
			expect(json.reviewerId).toBeUndefined();
			expect(json.reviewedAt).toBeUndefined();
			expect(json.reviewComment).toBeUndefined();
		});

		it("round-trips through fromPrimitives", () => {
			const pr = AccountingPr.create(makeProps());
			const json = pr.toJSON();
			const restored = AccountingPr.fromPrimitives(json);
			expect(restored.id).toBe(pr.id);
			expect(restored.title).toBe(pr.title);
			expect(restored.status).toBe(pr.status);
			expect(restored.createdAt.toISOString()).toBe(pr.createdAt.toISOString());
		});
	});

	describe("immutability", () => {
		it("submitForReview returns a new instance", () => {
			const pr = AccountingPr.create(makeProps({ status: "DRAFT" }));
			const submitted = pr.submitForReview("reviewer-1");
			expect(pr.status).toBe("DRAFT");
			expect(submitted.status).toBe("PENDING_REVIEW");
			expect(submitted).not.toBe(pr);
		});

		it("approve returns a new instance", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const approved = pr.approve("reviewer-1");
			expect(pr.status).toBe("PENDING_REVIEW");
			expect(approved.status).toBe("APPROVED");
			expect(approved).not.toBe(pr);
		});

		it("reject returns a new instance", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const rejected = pr.reject("No");
			expect(pr.status).toBe("PENDING_REVIEW");
			expect(rejected.status).toBe("REJECTED");
			expect(rejected).not.toBe(pr);
		});

		it("post returns a new instance", () => {
			const pr = AccountingPr.create(makeProps({ status: "APPROVED" }));
			const posted = pr.post();
			expect(pr.status).toBe("APPROVED");
			expect(posted.status).toBe("POSTED");
			expect(posted).not.toBe(pr);
		});

		it("addSignature returns a new instance", () => {
			const pr = AccountingPr.create(makeProps({ status: "PENDING_REVIEW" }));
			const signed = pr.addSignature("signer-1");
			expect(pr.approveSignatures).toHaveLength(0);
			expect(signed.approveSignatures).toHaveLength(1);
		});

		it("Object.freeze prevents mutation", () => {
			const pr = AccountingPr.create(makeProps());
			expect(Object.isFrozen(pr)).toBe(true);
		});
	});
});
