import type { CloseChecklistRepository } from "@drenyra/domain/repositories/close-checklist.repository";

export class MonthlyCloseController {
	constructor(private readonly repo: CloseChecklistRepository) {}

	async createChecklist(data: {
		companyId: string;
		period: string;
		name: string;
		assignedToId?: string;
		dueDate?: string;
		notes?: string;
	}) {
		return this.repo.save({
			companyId: data.companyId,
			period: data.period,
			name: data.name,
			assignedToId: data.assignedToId ?? null,
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			notes: data.notes ?? null,
			status: "PENDING",
			completedAt: null,
		});
	}

	async listChecklists(companyId: string, period?: string) {
		if (period) {
			return this.repo.findByCompanyAndPeriod(companyId, period);
		}
		return this.repo.findAllByCompany(companyId);
	}

	async getChecklist(id: string) {
		return this.repo.findById(id);
	}

	/** True only when the checklist exists and belongs to `companyId`. */
	async ownsChecklist(companyId: string, checklistId: string) {
		const checklist = await this.repo.findById(checklistId);
		return checklist?.companyId === companyId;
	}

	/** True only when the item's checklist belongs to `companyId`. */
	async ownsItem(companyId: string, itemId: string) {
		const item = await this.repo.findItemById(itemId);
		return item ? this.ownsChecklist(companyId, item.checklistId) : false;
	}

	/** True only when the gate exists and belongs to `companyId`. */
	async ownsGate(companyId: string, gateId: string) {
		const gate = await this.repo.findGateById(gateId);
		return gate?.companyId === companyId;
	}

	async updateChecklist(
		id: string,
		data: {
			name?: string;
			status?: string;
			assignedToId?: string;
			dueDate?: string;
			notes?: string;
		},
	) {
		return this.repo.updateStatus(id, (data.status as any) ?? "PENDING");
	}

	async addItem(
		checklistId: string,
		data: {
			name: string;
			description?: string;
			category: string;
			assignedToId?: string;
			sortOrder?: number;
		},
	) {
		return this.repo.saveItem({
			checklistId,
			name: data.name,
			description: data.description ?? null,
			category: data.category as any,
			assignedToId: data.assignedToId ?? null,
			sortOrder: data.sortOrder ?? 0,
			status: "PENDING",
			completedAt: null,
			completedById: null,
			notes: null,
			evidenceIds: [],
		});
	}

	/**
	 * `actorId` is the session user, never a request field, so the audit
	 * trail cannot be forged.
	 */
	async updateItem(
		id: string,
		data: { status?: string; notes?: string },
		actorId: string | null,
	) {
		const update: Record<string, unknown> = {};
		if (data.status) update.status = data.status;
		if (data.notes) update.notes = data.notes;
		if (data.status === "COMPLETED") {
			update.completedAt = new Date();
			if (actorId) update.completedById = actorId;
		}
		return this.repo.updateItem(id, update as any);
	}

	async attachEvidence(itemId: string, evidenceId: string) {
		const item = await this.repo.findItemById(itemId);
		if (!item) return null;

		const currentIds = item.evidenceIds ?? [];
		if (currentIds.includes(evidenceId)) return item;

		return this.repo.updateItem(itemId, {
			evidenceIds: [...currentIds, evidenceId],
		});
	}

	async getGates(companyId: string, period: string) {
		return this.repo.findGatesByCompanyAndPeriod(companyId, period);
	}

	async overrideGate(
		id: string,
		status: string,
		resolution: string,
		overrideById: string,
	) {
		return this.repo.overrideGate(id, status as any, resolution, overrideById);
	}

	async getDashboard(companyId: string, period: string) {
		return this.repo.getDashboard(companyId, period);
	}

	async getPeriods(companyId: string) {
		return this.repo.count(companyId);
	}
}
