import { AccountingDiff, createDiffId, type DiffType } from "@drenyra/domain";
import { AppError } from "../../lib/errors";
import type {
	DiffChangeDTO,
	DiffDetailDTO,
	DiffDTO,
	DiffImpactDTO,
	ReviewQueueItemDTO,
	ReviewQueueStatsDTO,
} from "./diffs.types";

const ERROR_PREFIX = "DIFF";

const ErrorCodes = {
	NOT_FOUND: `${ERROR_PREFIX}_NOT_FOUND`,
	INVALID_TRANSITION: `${ERROR_PREFIX}_INVALID_TRANSITION`,
} as const;

class InMemoryStore {
	private diffs: AccountingDiff[] = [];
	private queue: Array<{
		id: string;
		diffId: string;
		title: string;
		type: DiffType;
		priority: "critical" | "high" | "medium" | "low";
		status: string;
		clientName: string;
		period: string;
		agentName: string;
		riskScore: number;
		createdAt: string;
	}> = [];

	private decisions: Map<
		string,
		Array<{
			action: string;
			comment?: string;
			reviewerId: string;
			timestamp: string;
		}>
	> = new Map();

	add(diff: AccountingDiff): void {
		this.diffs.push(diff);
		this.queue.push({
			id: crypto.randomUUID(),
			diffId: diff.id,
			title: diff.title,
			type: diff.type,
			priority:
				diff.impact.riskScore > 70
					? "critical"
					: diff.impact.riskScore > 50
						? "high"
						: diff.impact.riskScore > 30
							? "medium"
							: "low",
			status: "pending",
			clientName: "Empresa SAC",
			period: "2026-06",
			agentName: "SIRE Agent",
			riskScore: diff.impact.riskScore,
			createdAt: diff.createdAt.toISOString(),
		});
		this.decisions.set(diff.id, []);
	}

	getAll(): AccountingDiff[] {
		return this.diffs;
	}

	getById(id: string): AccountingDiff | undefined {
		return this.diffs.find((d) => d.id === id);
	}

	update(id: string, updated: AccountingDiff): void {
		const idx = this.diffs.findIndex((d) => d.id === id);
		if (idx !== -1) {
			this.diffs[idx] = updated;
			this.decisions.get(id)?.push({
				action: updated.status,
				reviewerId: updated.reviewerId ?? "unknown",
				comment: updated.rejectionReason ?? updated.pendingQuestion,
				timestamp: updated.updatedAt.toISOString(),
			});
		}
	}

	getQueue(): typeof this.queue {
		return this.queue;
	}

	getQueueById(id: string): (typeof this.queue)[0] | undefined {
		return this.queue.find((q) => q.diffId === id);
	}

	getDecisions(diffId: string) {
		return this.decisions.get(diffId) ?? [];
	}

	getStats(): ReviewQueueStatsDTO {
		const items = this.queue;
		return {
			pending: items.filter((i) => i.status === "pending").length,
			critical: items.filter((i) => i.priority === "critical").length,
			high: items.filter((i) => i.priority === "high").length,
			medium: items.filter((i) => i.priority === "medium").length,
			low: items.filter((i) => i.priority === "low").length,
			overdue: 0,
		};
	}
}

const store = new InMemoryStore();

const demoDiff = AccountingDiff.create({
	id: createDiffId(),
	threadId: "thread-1",
	type: "journalEntry",
	title: "Registro de compra F001-2841 — IGV crédito fiscal",
	description: "Propuesta de asiento contable para factura no registrada",
	changes: [
		{
			field: "Cuenta débito",
			before: "N/A (no registrado)",
			after: "60 Compras - S/ 1,000.00",
		},
		{
			field: "IGV",
			before: "N/A (no reconocido)",
			after: "4011 IGV - S/ 180.00",
		},
		{
			field: "Cuenta crédito",
			before: "N/A (sin pasivo)",
			after: "42 Proveedores - S/ 1,180.00",
		},
	],
	impact: {
		taxImpact: { amount: 180, currency: "PEN", concept: "IGV crédito fiscal" },
		riskScore: 25,
		confidence: 92,
	},
	createdBy: "sire-agent",
	evidenceIds: ["xml-001", "pdf-001", "cdr-001"],
});
store.add(demoDiff);

export class DiffsService {
	listDiffs(
		_companyId: string | undefined,
		filters?: { status?: string; type?: string; priority?: string },
	): { data: DiffDTO[]; total: number } {
		let items = store.getAll().map((d) => this.toDTO(d));
		if (filters?.status)
			items = items.filter((i) => i.status === filters.status);
		if (filters?.type) items = items.filter((i) => i.type === filters.type);
		if (filters?.priority)
			items = items.filter((i) => i.priority === filters.priority);
		return { data: items, total: items.length };
	}

	getDiff(_companyId: string | undefined, id: string): DiffDetailDTO {
		const diff = store.getById(id);
		if (!diff)
			throw new AppError(404, ErrorCodes.NOT_FOUND, `Diff not found: ${id}`);
		return this.toDetailDTO(diff);
	}

	approveDiff(
		_companyId: string | undefined,
		id: string,
	): { success: boolean } {
		const diff = store.getById(id);
		if (!diff)
			throw new AppError(404, ErrorCodes.NOT_FOUND, `Diff not found: ${id}`);
		const updated = diff.approve("current-user");
		store.update(id, updated);
		return { success: true };
	}

	rejectDiff(
		_companyId: string | undefined,
		id: string,
		reason: string,
	): { success: boolean } {
		const diff = store.getById(id);
		if (!diff)
			throw new AppError(404, ErrorCodes.NOT_FOUND, `Diff not found: ${id}`);
		const updated = diff.reject("current-user", reason);
		store.update(id, updated);
		return { success: true };
	}

	requestInfo(
		_companyId: string | undefined,
		id: string,
		question: string,
	): { success: boolean } {
		const diff = store.getById(id);
		if (!diff)
			throw new AppError(404, ErrorCodes.NOT_FOUND, `Diff not found: ${id}`);
		const updated = diff.requestInfo(question);
		store.update(id, updated);
		return { success: true };
	}

	listQueue(
		_companyId: string | undefined,
		_filters?: Record<string, string>,
	): { data: ReviewQueueItemDTO[] } {
		const items = store.getQueue().sort((a, b) => {
			const order = { critical: 0, high: 1, medium: 2, low: 3 };
			return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
		});
		return { data: items as ReviewQueueItemDTO[] };
	}

	getQueueStats(_companyId: string | undefined): ReviewQueueStatsDTO {
		return store.getStats();
	}

	batchApprove(
		_companyId: string | undefined,
		ids: string[],
	): { approved: number; failed: number } {
		let approved = 0;
		let failed = 0;
		for (const id of ids) {
			try {
				this.approveDiff(_companyId, id);
				approved++;
			} catch {
				failed++;
			}
		}
		return { approved, failed };
	}

	private toDTO(diff: AccountingDiff): DiffDTO {
		return {
			id: diff.id,
			threadId: diff.threadId,
			title: diff.title,
			type: diff.type,
			status: diff.status,
			priority: store.getQueueById(diff.id)?.priority ?? "medium",
			riskScore: diff.impact.riskScore,
			confidence: diff.impact.confidence,
			changesCount: diff.changes.length,
			createdAt: diff.createdAt.toISOString(),
		};
	}

	private toDetailDTO(diff: AccountingDiff): DiffDetailDTO {
		const base = this.toDTO(diff);
		return {
			...base,
			changes: diff.changes as DiffChangeDTO[],
			impact: diff.impact as DiffImpactDTO,
			evidenceIds: [...diff.evidenceIds],
			reviewerId: diff.reviewerId,
			rejectionReason: diff.rejectionReason,
			pendingQuestion: diff.pendingQuestion,
			decisions: store.getDecisions(diff.id),
		};
	}
}

export const diffsService = new DiffsService();
