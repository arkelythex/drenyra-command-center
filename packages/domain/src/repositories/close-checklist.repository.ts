export type {
	ChecklistCategory,
	CloseItemStatus,
	CloseStatus,
	GateStatus,
	GateType,
} from "@arkelythex/persistence/schema/monthly-close.schema";

export interface CloseChecklistRecord {
	id: string;
	companyId: string;
	period: string;
	name: string;
	status: CloseStatus;
	assignedToId: string | null;
	progress: number;
	dueDate: Date | null;
	completedAt: Date | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CloseChecklistItemRecord {
	id: string;
	checklistId: string;
	name: string;
	description: string | null;
	category: ChecklistCategory;
	status: CloseItemStatus;
	assignedToId: string | null;
	completedAt: Date | null;
	completedById: string | null;
	notes: string | null;
	evidenceIds: string[];
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CloseGateRecord {
	id: string;
	companyId: string;
	period: string;
	gateType: GateType;
	status: GateStatus;
	description: string | null;
	resolution: string | null;
	overrideById: string | null;
	overriddenAt: Date | null;
	readOnly: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface CloseChecklistWithItems extends CloseChecklistRecord {
	items: CloseChecklistItemRecord[];
}

export interface CloseDashboard {
	period: string;
	overallProgress: number;
	totalChecklists: number;
	completedChecklists: number;
	overdueItems: number;
	gates: CloseGateRecord[];
}

export interface CloseChecklistRepository {
	save(
		data: Omit<
			CloseChecklistRecord,
			"id" | "createdAt" | "updatedAt" | "progress"
		>,
	): Promise<CloseChecklistRecord>;
	findById(id: string): Promise<CloseChecklistWithItems | null>;
	findByCompanyAndPeriod(
		companyId: string,
		period: string,
	): Promise<CloseChecklistRecord[]>;
	findAllByCompany(companyId: string): Promise<CloseChecklistRecord[]>;
	updateStatus(
		id: string,
		status: CloseStatus,
	): Promise<CloseChecklistRecord | null>;
	updateProgress(id: string): Promise<number>;
	delete(id: string): Promise<void>;
	count(companyId: string): Promise<number>;

	saveItem(
		data: Omit<CloseChecklistItemRecord, "id" | "createdAt" | "updatedAt">,
	): Promise<CloseChecklistItemRecord>;
	updateItem(
		id: string,
		data: Partial<
			Pick<
				CloseChecklistItemRecord,
				"status" | "completedAt" | "completedById" | "notes" | "evidenceIds"
			>
		>,
	): Promise<CloseChecklistItemRecord | null>;
	getItemsByChecklistId(
		checklistId: string,
	): Promise<CloseChecklistItemRecord[]>;

	saveGate(
		data: Omit<CloseGateRecord, "id" | "createdAt" | "updatedAt">,
	): Promise<CloseGateRecord>;
	findGatesByCompanyAndPeriod(
		companyId: string,
		period: string,
	): Promise<CloseGateRecord[]>;
	overrideGate(
		id: string,
		status: GateStatus,
		resolution: string,
		overrideById: string,
	): Promise<CloseGateRecord | null>;

	getDashboard(companyId: string, period: string): Promise<CloseDashboard>;
}
