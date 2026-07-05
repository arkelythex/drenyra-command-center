import { describe, expect, it } from "vitest";
import type { Money } from "../../value-objects";
import type { DomainKey, FiscalProjection, LegalProjection } from "../case";
import { Case, CaseId, CaseProjectionAttached } from "../case";

describe("Case", () => {
	// ─── Factory ──────────────────────────────────────────────────────

	describe("create", () => {
		it("should create a case with status open", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });

			expect(caseEntity.id).toBeDefined();
			expect(caseEntity.companyId).toBe("emp-001");
			expect(caseEntity.status).toBe("open");
			expect(caseEntity.createdAt).toBeInstanceOf(Date);
			expect(caseEntity.updatedAt).toBeInstanceOf(Date);
		});

		it("should generate unique IDs", () => {
			const case1 = Case.create({ companyId: "emp-001" });
			const case2 = Case.create({ companyId: "emp-001" });

			expect(case1.id).not.toBe(case2.id);
		});
	});

	// ─── CaseId ───────────────────────────────────────────────────────

	describe("CaseId", () => {
		it("should create a valid case ID", () => {
			const id = CaseId("test-123");
			expect(id).toBe("test-123");
		});

		it("should throw on empty ID", () => {
			expect(() => CaseId("")).toThrow("CaseId cannot be empty");
		});
	});

	// ─── Projections ──────────────────────────────────────────────────

	describe("projections", () => {
		it("should start with no projections", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });

			expect(caseEntity.getAttachedDomains()).toEqual([]);
			expect(caseEntity.getAllProjections().size).toBe(0);
		});

		it("should attach a fiscal projection", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });

			const fiscalProjection: FiscalProjection = {
				domain: "fiscal",
				ruc: "20123456789",
				period: "2026-01",
				totalIncome: { amount: 50000, currency: "PEN" } as Money,
				totalTax: { amount: 9000, currency: "PEN" } as Money,
				status: "pending",
				updatedAt: new Date(),
				metadata: {
					summary: "Declaración mensual IGV enero 2026",
					priority: "high",
					tags: ["igv", "monthly"],
				},
			};

			const updated = caseEntity.attachProjection(
				"fiscal",
				fiscalProjection,
				"fiscal",
			);

			expect(updated.getAttachedDomains()).toEqual(["fiscal"]);
			expect(updated.getProjection<FiscalProjection>("fiscal")).toEqual(
				expect.objectContaining({
					domain: "fiscal",
					ruc: "20123456789",
				}),
			);
		});

		it("should not allow domain A to modify domain B projection", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });

			const legalProjection = {
				domain: "legal" as DomainKey,
				matterType: "contract_dispute",
				clientId: "client-001",
				deadlines: [],
				status: "research" as const,
				updatedAt: new Date(),
				metadata: {
					summary: "Disputa contractual",
					priority: "medium",
					tags: ["contract"],
				},
			};

			expect(() =>
				caseEntity.attachProjection("fiscal", legalProjection as any, "legal"),
			).toThrow('Domain "fiscal" cannot modify projection owned by "legal"');
		});

		it("should allow multiple domains to attach projections", () => {
			let caseEntity = Case.create({ companyId: "emp-001" });

			const fiscalProjection: FiscalProjection = {
				domain: "fiscal",
				ruc: "20123456789",
				period: "2026-01",
				totalIncome: { amount: 50000, currency: "PEN" } as Money,
				totalTax: { amount: 9000, currency: "PEN" } as Money,
				status: "pending",
				updatedAt: new Date(),
				metadata: {
					summary: "Declaración mensual IGV",
					priority: "high",
					tags: ["igv"],
				},
			};

			const legalProjection: LegalProjection = {
				domain: "legal",
				matterType: "contract_dispute",
				clientId: "client-001",
				deadlines: [new Date("2026-03-15")],
				status: "research",
				updatedAt: new Date(),
				metadata: {
					summary: "Disputa contractual con proveedor",
					priority: "medium",
					tags: ["contract", "supplier"],
				},
			};

			caseEntity = caseEntity.attachProjection(
				"fiscal",
				fiscalProjection,
				"fiscal",
			);
			caseEntity = caseEntity.attachProjection(
				"legal",
				legalProjection,
				"legal",
			);

			expect(caseEntity.getAttachedDomains()).toEqual(["fiscal", "legal"]);
			expect(caseEntity.getAllProjections().size).toBe(2);
		});

		it("should return undefined for non-existent projection", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });

			expect(caseEntity.getProjection("fiscal")).toBeUndefined();
		});
	});

	// ─── Status Transitions ───────────────────────────────────────────

	describe("status transitions", () => {
		it("should activate an open case", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });
			const activated = caseEntity.activate();

			expect(activated.status).toBe("active");
		});

		it("should not activate a non-open case", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });
			const activated = caseEntity.activate();

			expect(() => activated.activate()).toThrow(
				'Cannot activate case in status "active"',
			);
		});

		it("should resolve an active case", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });
			const activated = caseEntity.activate();
			const resolved = activated.resolve();

			expect(resolved.status).toBe("resolved");
		});

		it("should close a resolved case", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });
			const activated = caseEntity.activate();
			const resolved = activated.resolve();
			const closed = resolved.close();

			expect(closed.status).toBe("closed");
		});
	});

	// ─── Immutability ─────────────────────────────────────────────────

	describe("immutability", () => {
		it("should not mutate original case when attaching projection", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });

			const fiscalProjection: FiscalProjection = {
				domain: "fiscal",
				ruc: "20123456789",
				period: "2026-01",
				totalIncome: { amount: 50000, currency: "PEN" } as Money,
				totalTax: { amount: 9000, currency: "PEN" } as Money,
				status: "pending",
				updatedAt: new Date(),
				metadata: {
					summary: "Declaración mensual IGV",
					priority: "high",
					tags: ["igv"],
				},
			};

			const updated = caseEntity.attachProjection(
				"fiscal",
				fiscalProjection,
				"fiscal",
			);

			// Original is unchanged
			expect(caseEntity.getAttachedDomains()).toEqual([]);
			// Updated has the projection
			expect(updated.getAttachedDomains()).toEqual(["fiscal"]);
		});
	});

	// ─── Events ───────────────────────────────────────────────────────

	describe("events", () => {
		it("should emit CaseProjectionAttached event", () => {
			const caseEntity = Case.create({ companyId: "emp-001" });
			const event = Case.projectionAttached(caseEntity.id, "fiscal");

			expect(event.eventName).toBe("case.projection.attached");
			expect(event.caseId).toBe(caseEntity.id);
			expect(event.domain).toBe("fiscal");
			expect(event.occurredOn).toBeInstanceOf(Date);
			expect(event.eventId).toBeDefined();
		});
	});
});
