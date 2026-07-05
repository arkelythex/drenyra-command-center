import type {
	FiscalMemory,
	FiscalMemoryCategory,
	FiscalMemoryRevision,
	FiscalMemoryScope,
	FiscalMemorySeverity,
} from "@drenyra/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@drenyra/domain/repositories/fiscal-memory.repository";
import { describe, expect, it } from "vitest";
import { FiscalMemoryService } from "../fiscal-memory.service";

const scope: FiscalMemoryScope = {
	tenantId: "tenant-1",
	companyId: "company-1",
	ruc: "20123456789",
};

class InMemoryFiscalMemoryRepository implements FiscalMemoryRepository {
	readonly memories = new Map<string, FiscalMemory>();
	readonly revisions = new Map<string, FiscalMemoryRevision[]>();

	async save(memory: FiscalMemory): Promise<void> {
		this.memories.set(memory.id, memory);
	}

	async findById(
		id: string,
		findScope: FiscalMemoryScope,
	): Promise<FiscalMemory | null> {
		const memory = this.memories.get(id);
		if (!memory) return null;
		return this.matchesScope(memory, findScope) ? memory : null;
	}

	async findByPeriod(
		findScope: FiscalMemoryScope,
		period: string,
	): Promise<FiscalMemory[]> {
		return this.all(findScope).filter((memory) => memory.period === period);
	}

	async findByCategory(
		findScope: FiscalMemoryScope,
		category: FiscalMemoryCategory,
	): Promise<FiscalMemory[]> {
		return this.all(findScope).filter((memory) => memory.category === category);
	}

	async findBySeverity(
		findScope: FiscalMemoryScope,
		severity: FiscalMemorySeverity,
	): Promise<FiscalMemory[]> {
		return this.all(findScope).filter((memory) => memory.severity === severity);
	}

	async findByEvidenceRef(
		findScope: FiscalMemoryScope,
		evidenceRef: string,
	): Promise<FiscalMemory[]> {
		return this.all(findScope).filter((memory) =>
			memory.evidenceRefs.includes(evidenceRef),
		);
	}

	async findRelated(
		findScope: FiscalMemoryScope,
		memoryId: string,
	): Promise<FiscalMemory[]> {
		return this.all(findScope).filter(
			(memory) =>
				memory.id === memoryId || memory.relatedMemoryIds.includes(memoryId),
		);
	}

	async saveRevision(revision: FiscalMemoryRevision): Promise<void> {
		const current = this.revisions.get(revision.memoryId) ?? [];
		this.revisions.set(revision.memoryId, [...current, revision]);
	}

	async findRevisions(memoryId: string): Promise<FiscalMemoryRevision[]> {
		return this.revisions.get(memoryId) ?? [];
	}

	private all(findScope: FiscalMemoryScope): FiscalMemory[] {
		return [...this.memories.values()].filter((memory) =>
			this.matchesScope(memory, findScope),
		);
	}

	private matchesScope(
		memory: FiscalMemory,
		findScope: FiscalMemoryScope,
	): boolean {
		return (
			memory.tenantId === findScope.tenantId &&
			memory.companyId === findScope.companyId &&
			memory.ruc === findScope.ruc
		);
	}
}

describe("FiscalMemoryService", () => {
	it("records fiscal decisions with evidence", async () => {
		const repo = new InMemoryFiscalMemoryRepository();
		const service = new FiscalMemoryService(repo);

		const memory = await service.recordDecision({
			...scope,
			period: "2026-05",
			severity: "high",
			title: "IGV credit criterion",
			summary: "Controller approved the criterion.",
			evidenceRefs: ["evidence://invoice-1"],
			tags: ["igv"],
			createdBy: "accountant-1",
			approvedBy: "controller-1",
		});

		expect(memory.category).toBe("tax_decision");
		expect(repo.memories.get(memory.id)).toBeDefined();
	});

	it("respects tenant/company scope", async () => {
		const repo = new InMemoryFiscalMemoryRepository();
		const service = new FiscalMemoryService(repo);
		const memory = await service.recordAuditFinding({
			...scope,
			period: "2026-05",
			severity: "critical",
			title: "Unsupported credit",
			summary: "Missing evidence for fiscal credit.",
			evidenceRefs: ["evidence://audit-1"],
			tags: ["error:UNSUPPORTED_CREDIT"],
			createdBy: "audit-agent",
		});

		const otherCompany = await repo.findById(memory.id, {
			...scope,
			companyId: "company-2",
		});

		expect(otherCompany).toBeNull();
	});

	it("returns only memories from the requested period and evidence ref", async () => {
		const repo = new InMemoryFiscalMemoryRepository();
		const service = new FiscalMemoryService(repo);
		for (const period of ["2026-04", "2026-05", "2026-06"]) {
			await service.recordAuditFinding({
				...scope,
				period,
				severity: "medium",
				title: `Finding ${period}`,
				summary: "Finding with evidence.",
				evidenceRefs: [`evidence://${period}`],
				tags: [],
				createdBy: "audit-agent",
			});
		}

		const may = await repo.findByPeriod(scope, "2026-05");
		const evidence = await repo.findByEvidenceRef(scope, "evidence://2026-05");

		expect(may).toHaveLength(1);
		expect(may[0].period).toBe("2026-05");
		expect(evidence).toHaveLength(1);
	});

	it("creates a revision when resolving memory", async () => {
		const repo = new InMemoryFiscalMemoryRepository();
		const service = new FiscalMemoryService(repo);
		const memory = await service.recordAuditFinding({
			...scope,
			period: "2026-05",
			severity: "high",
			title: "Audit finding",
			summary: "Finding needs remediation.",
			evidenceRefs: ["evidence://audit-2"],
			tags: [],
			createdBy: "audit-agent",
		});

		const resolved = await service.resolveMemory({
			id: memory.id,
			scope,
			changedBy: "controller-1",
			changeReason: "Resolved with evidence review",
		});

		const revisions = await repo.findRevisions(memory.id);
		expect(resolved.status).toBe("resolved");
		expect(revisions).toHaveLength(1);
		expect(revisions[0].previousValue.status).toBe("active");
	});
});
