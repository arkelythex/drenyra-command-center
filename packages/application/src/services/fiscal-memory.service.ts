import {
	FiscalMemory,
	FiscalMemoryRevision,
	type FiscalMemoryCategory,
	type FiscalMemoryProps,
	type FiscalMemoryScope,
	type FiscalMemorySeverity,
} from "@arkelythex/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@arkelythex/domain/repositories/fiscal-memory.repository";

const createFiscalMemoryId = (): string =>
	`fiscal-memory-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Input required to record a scoped fiscal-memory entry.
 *
 * @remarks Fiscal decisions and findings must reference evidence through evidenceRefs.
 * @example
 * const input: RecordFiscalMemoryInput = { tenantId, companyId, ruc, period, category, severity, title, summary, createdBy };
 */
export interface RecordFiscalMemoryInput extends FiscalMemoryScope {
	readonly id?: string;
	readonly period: string;
	readonly category: FiscalMemoryCategory;
	readonly severity: FiscalMemorySeverity;
	readonly title: string;
	readonly summary: string;
	readonly evidenceRefs?: readonly string[];
	readonly tags?: readonly string[];
	readonly createdBy: string;
	readonly approvedBy?: string;
	readonly sourceAgentId?: string;
	readonly relatedMemoryIds?: readonly string[];
}

/**
 * Input for accountant-approved criteria, tax decisions, and risk exceptions.
 *
 * @remarks The category defaults to tax_decision when omitted.
 * @example
 * const decision: RecordDecisionInput = { ...input, evidenceRefs: ["evidence:1"] };
 */
export type RecordDecisionInput = Omit<RecordFiscalMemoryInput, "category"> & {
	readonly category?: "accounting_criterion" | "tax_decision" | "risk_exception";
};

/**
 * Input for audit findings emitted by compliance or review agents.
 *
 * @remarks Audit findings require evidence references through the domain model.
 * @example
 * const finding: RecordAuditFindingInput = { ...input, severity: "critical" };
 */
export type RecordAuditFindingInput = Omit<RecordFiscalMemoryInput, "category">;

/**
 * Input for monthly closing fiscal-memory records.
 *
 * @remarks Monthly closing memories capture closing decisions and attached evidence.
 * @example
 * const closing: RecordMonthlyClosingInput = { ...input, period: "2026-05" };
 */
export type RecordMonthlyClosingInput = Omit<RecordFiscalMemoryInput, "category">;

/**
 * Application service that records and revises verified fiscal memories.
 *
 * @remarks The service coordinates persistence and revisions; validation remains in the domain.
 * @example
 * const memory = await service.recordDecision(input);
 */
export class FiscalMemoryService {
	constructor(private readonly repository: FiscalMemoryRepository) {}

	/**
	 * Records an accountant or compliance decision as fiscal memory.
	 *
	 * @param input - Scoped decision data with evidence references when required.
	 * @returns The persisted fiscal memory.
	 * @throws InvalidFiscalMemoryError when required evidence or scope is missing.
	 */
	async recordDecision(input: RecordDecisionInput): Promise<FiscalMemory> {
		return this.recordMemory({
			...input,
			category: input.category ?? "tax_decision",
		});
	}

	/**
	 * Records an audit finding under the audit_finding category.
	 *
	 * @param input - Scoped finding data.
	 * @returns The persisted audit finding memory.
	 * @throws InvalidFiscalMemoryError when evidence or scope validation fails.
	 */
	async recordAuditFinding(input: RecordAuditFindingInput): Promise<FiscalMemory> {
		return this.recordMemory({
			...input,
			category: "audit_finding",
		});
	}

	/**
	 * Records monthly closing context for a company fiscal period.
	 *
	 * @param input - Scoped monthly closing data.
	 * @returns The persisted monthly closing memory.
	 * @throws InvalidFiscalMemoryError when required evidence is missing.
	 */
	async recordMonthlyClosingMemory(input: RecordMonthlyClosingInput): Promise<FiscalMemory> {
		return this.recordMemory({
			...input,
			category: "monthly_closing",
		});
	}

	/**
	 * Marks an active fiscal memory as resolved and creates an audit revision.
	 *
	 * @param input - Scope, actor, reason, and optional replacement summary.
	 * @returns The updated fiscal memory.
	 * @throws Error when the scoped memory cannot be found.
	 */
	async resolveMemory(input: {
		readonly id: string;
		readonly scope: FiscalMemoryScope;
		readonly changedBy: string;
		readonly changeReason: string;
		readonly summary?: string;
	}): Promise<FiscalMemory> {
		return this.changeStatus({ ...input, status: "resolved" });
	}

	/**
	 * Marks an active fiscal memory as superseded and creates an audit revision.
	 *
	 * @param input - Scope, actor, reason, and optional replacement summary.
	 * @returns The updated fiscal memory.
	 * @throws Error when the scoped memory cannot be found.
	 */
	async supersedeMemory(input: {
		readonly id: string;
		readonly scope: FiscalMemoryScope;
		readonly changedBy: string;
		readonly changeReason: string;
		readonly summary?: string;
	}): Promise<FiscalMemory> {
		return this.changeStatus({ ...input, status: "superseded" });
	}

	private async recordMemory(input: RecordFiscalMemoryInput): Promise<FiscalMemory> {
		const now = new Date();
		const memory = FiscalMemory.create({
			id: input.id ?? createFiscalMemoryId(),
			tenantId: input.tenantId,
			companyId: input.companyId,
			ruc: input.ruc,
			period: input.period,
			category: input.category,
			severity: input.severity,
			title: input.title,
			summary: input.summary,
			evidenceRefs: input.evidenceRefs ?? [],
			tags: input.tags ?? [],
			createdBy: input.createdBy,
			approvedBy: input.approvedBy,
			sourceAgentId: input.sourceAgentId,
			relatedMemoryIds: input.relatedMemoryIds ?? [],
			createdAt: now,
			updatedAt: now,
		});

		await this.repository.save(memory);
		return memory;
	}

	private async changeStatus(input: {
		readonly id: string;
		readonly scope: FiscalMemoryScope;
		readonly status: "resolved" | "superseded";
		readonly changedBy: string;
		readonly changeReason: string;
		readonly summary?: string;
	}): Promise<FiscalMemory> {
		const current = await this.repository.findById(input.id, input.scope);
		if (!current) {
			throw new Error(`Fiscal memory not found: ${input.id}`);
		}

		const updatedStatus = current.withStatus(input.status);
		const updated = input.summary
			? updatedStatus.withSummary(input.summary)
			: updatedStatus;

		const revision = await this.createRevision({
			previousValue: current.toJSON(),
			nextValue: updated.toJSON(),
			changedBy: input.changedBy,
			changeReason: input.changeReason,
		});

		await this.repository.save(updated);
		await this.repository.saveRevision(revision);
		return updated;
	}

	private async createRevision(input: {
		readonly previousValue: FiscalMemoryProps;
		readonly nextValue: FiscalMemoryProps;
		readonly changedBy: string;
		readonly changeReason: string;
	}): Promise<FiscalMemoryRevision> {
		const revisions = await this.repository.findRevisions(input.previousValue.id);
		return FiscalMemoryRevision.create({
			id: createFiscalMemoryId(),
			memoryId: input.previousValue.id,
			revisionNumber: revisions.length + 1,
			changedBy: input.changedBy,
			changeReason: input.changeReason,
			previousValue: input.previousValue,
			nextValue: input.nextValue,
			createdAt: new Date(),
		});
	}
}
