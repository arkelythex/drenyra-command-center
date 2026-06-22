import { percepcionRepository } from "../../infrastructure/percepcion.repository";

export interface GetPendingPercepcionesInput {
	companyId: string;
	declarationPeriod?: string;
}

export interface PendingPercepcionItem {
	percepcionId: string;
	billId: string;
	agentRuc: string;
	percepcionType: string;
	totalAmount: number;
	percepcionAmount: number;
	declarationPeriod: string;
	sunatDueDate: string;
	daysUntilDue: number;
	isOverdue: boolean;
	status: "PENDING" | "DECLARED";
}

export interface PendingPercepcionesResult {
	items: PendingPercepcionItem[];
	totalPercepcionAmount: number;
	count: number;
	hasOverdue: boolean;
}

export async function getPendingPercepciones(
	input: GetPendingPercepcionesInput,
): Promise<PendingPercepcionesResult> {
	const repo = percepcionRepository;

	const percepciones = input.declarationPeriod
		? await repo.findByDeclarationPeriod(
				input.companyId,
				input.declarationPeriod,
			)
		: [
				...(await repo.findByStatus(input.companyId, "PENDING")),
				...(await repo.findByStatus(input.companyId, "DECLARED")),
			];

	const today = new Date();
	const items: PendingPercepcionItem[] = percepciones.map((r) => {
		const daysUntilDue = calcDaysUntil(r.sunatDueDate, today);
		return {
			percepcionId: r.id,
			billId: r.billId,
			agentRuc: r.agentRuc,
			percepcionType: r.percepcionType,
			totalAmount: r.totalAmount.getAmount(),
			percepcionAmount: r.percepcionAmount.getAmount(),
			declarationPeriod: r.declarationPeriod,
			sunatDueDate: r.sunatDueDate.toISOString().slice(0, 10),
			daysUntilDue,
			isOverdue:
				(r.status === "PENDING" || r.status === "DECLARED") &&
				today > r.sunatDueDate,
			status: r.status as "PENDING" | "DECLARED",
		};
	});

	const totalPercepcionAmount = items.reduce(
		(sum, i) => sum + i.percepcionAmount,
		0,
	);

	return {
		items,
		totalPercepcionAmount: round2(totalPercepcionAmount),
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
