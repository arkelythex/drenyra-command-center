import type { CloseChecklistRepository } from "@arkelythex/domain/repositories/close-checklist.repository";

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

	async updateItem(
		id: string,
		data: { status?: string; notes?: string; completedById?: string },
	) {
		const update: Record<string, unknown> = {};
		if (data.status) update.status = data.status;
		if (data.notes) update.notes = data.notes;
		if (data.completedById) update.completedById = data.completedById;
		if (data.status === "COMPLETED") {
			update.completedAt = new Date();
		}
		return this.repo.updateItem(id, update as any);
	}

	async attachEvidence(itemId: string, evidenceId: string) {
		const _items = await this.repo.getItemsByChecklistId(itemId);
		const item = _items.find((i) => i.id === itemId);
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
}
