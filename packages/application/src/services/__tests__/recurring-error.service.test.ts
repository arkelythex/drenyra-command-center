import type {
	FiscalMemory,
	FiscalMemoryCategory,
	FiscalMemoryRevision,
	FiscalMemoryScope,
	FiscalMemorySeverity,
} from "@drenyra/domain/fiscal-memory";
import { FiscalMemory as FiscalMemoryEntity } from "@drenyra/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@drenyra/domain/repositories/fiscal-memory.repository";
import { describe, expect, it } from "vitest";
import { RecurringErrorService } from "../recurring-error.service";

const scope: FiscalMemoryScope = {
	tenantId: "tenant-1",
	companyId: "company-1",
	ruc: "20123456789",
};

class MemoryRepo implements FiscalMemoryRepository {
	constructor(private readonly values: readonly FiscalMemory[]) {}
	async save(): Promise<void> {
		/* stub */
	}
	async findById(): Promise<FiscalMemory | null> {
		return null;
	}
	async findByPeriod(
		findScope: FiscalMemoryScope,
		period: string,
	): Promise<FiscalMemory[]> {
		return this.values.filter(
			(memory) =>
				memory.tenantId === findScope.tenantId &&
				memory.companyId === findScope.companyId &&
				memory.ruc === findScope.ruc &&
				memory.period === period,
		);
	}
	async findByCategory(
		_scope: FiscalMemoryScope,
		_category: FiscalMemoryCategory,
	): Promise<FiscalMemory[]> {
		return [];
	}
	async findBySeverity(
		_scope: FiscalMemoryScope,
		_severity: FiscalMemorySeverity,
	): Promise<FiscalMemory[]> {
		return [];
	}
	async findByEvidenceRef(): Promise<FiscalMemory[]> {
		return [];
	}
	async findRelated(): Promise<FiscalMemory[]> {
		return [];
	}
	async saveRevision(_revision: FiscalMemoryRevision): Promise<void> {
		/* stub */
	}
	async findRevisions(): Promise<FiscalMemoryRevision[]> {
		return [];
	}
}

const memoryFor = (period: string): FiscalMemory =>
	FiscalMemoryEntity.create({
		id: `memory-${period}`,
		...scope,
		period,
		category: "recurring_error",
		severity: "medium",
		title: "Unsupported credit recurring error",
		summary: "Same unsupported credit issue found again.",
		evidenceRefs: [],
		tags: ["error:UNSUPPORTED_CREDIT"],
		createdBy: "audit-agent",
	});

describe("RecurringErrorService", () => {
	it("escalates recurrence across three periods", async () => {
		const repo = new MemoryRepo([
			memoryFor("2026-03"),
			memoryFor("2026-04"),
			memoryFor("2026-05"),
		]);
		const service = new RecurringErrorService(repo);

		const result = await service.evaluate({
			scope,
			periods: ["2026-03", "2026-04", "2026-05"],
			errorCode: "UNSUPPORTED_CREDIT",
		});

		expect(result.recurrenceCount).toBe(3);
		expect(result.periods).toEqual(["2026-03", "2026-04", "2026-05"]);
		expect(result.recommendedAction).toBe("escalate");
		expect(result.severity).toBe("high");
	});
});
