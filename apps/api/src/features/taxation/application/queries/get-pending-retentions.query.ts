import { retencionRepository } from "../../infrastructure/retencion.repository";

export interface GetPendingRetentionsInput {
	companyId: string;
	declarationPeriod?: string;
}

export interface PendingRetentionItem {
	retentionId: string;
	billId: string;
	supplierRuc: string;
	baseAmount: number;
	retentionAmount: number;
	netToSupplier: number;
	declarationPeriod: string;
	sunatDueDate: string;
	daysUntilDue: number;
	isOverdue: boolean;
	status: "PENDING" | "DECLARED";
}

export interface PendingRetentionsResult {
	items: PendingRetentionItem[];
	totalRetentionAmount: number;
	count: number;
	hasOverdue: boolean;
}

export async function getPendingRetentions(
	input: GetPendingRetentionsInput,
): Promise<PendingRetentionsResult> {
	const repo = retencionRepository;

	const retenciones = input.declarationPeriod
		? await repo.findByDeclarationPeriod(
				input.companyId,
				input.declarationPeriod,
			)
		: [
				...(await repo.findByStatus(input.companyId, "PENDING")),
				...(await repo.findByStatus(input.companyId, "DECLARED")),
			];

	const today = new Date();
	const items: PendingRetentionItem[] = retenciones.map((r) => {
		const daysUntilDue = calcDaysUntil(r.sunatDueDate, today);
		return {
			retentionId: r.id,
			billId: r.billId,
			supplierRuc: r.supplierRuc,
			baseAmount: r.baseAmount.getAmount(),
			retentionAmount: r.retentionAmount.getAmount(),
			netToSupplier: r.netToSupplier.getAmount(),
			declarationPeriod: r.declarationPeriod,
			sunatDueDate: r.sunatDueDate.toISOString().slice(0, 10),
			daysUntilDue,
			isOverdue:
				(r.status === "PENDING" || r.status === "DECLARED") &&
				today > r.sunatDueDate,
			status: r.status as "PENDING" | "DECLARED",
		};
	});

	const totalRetentionAmount = items.reduce(
		(sum, i) => sum + i.retentionAmount,
		0,
	);

	return {
		items,
		totalRetentionAmount: round2(totalRetentionAmount),
		count: items.length,
		hasOverdue: items.some((i) => i.isOverdue),
	};
}

function calcDaysUntil(dueDate: Date, today: Date): number {
	const dueUtc = Date.UTC(
		dueDate.getFullYear(),
		dueDate.getMonth(),
		dueDate.getDate(),
	);
	const todayUtc = Date.UTC(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	);
	return Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
