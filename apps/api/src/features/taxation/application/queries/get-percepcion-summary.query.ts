import { percepcionRepository } from "../../infrastructure/percepcion.repository";

export interface GetPercepcionSummaryInput {
	companyId: string;
	declarationPeriod: string;
}

export interface PercepcionSummaryResult {
	declarationPeriod: string;
	sunatDueDate: string;
	totalPercepcionAmount: number;
	percepcionCount: number;
	byStatus: Record<"PENDING" | "DECLARED" | "PAID" | "CANCELLED", number>;
}

export async function getPercepcionSummary(
	input: GetPercepcionSummaryInput,
): Promise<PercepcionSummaryResult> {
	const repo = percepcionRepository;

	const percepciones = await repo.findByDeclarationPeriod(
		input.companyId,
		input.declarationPeriod,
	);

	const byStatus: Record<string, number> = {
		PENDING: 0,
		DECLARED: 0,
		PAID: 0,
		CANCELLED: 0,
	};

	let totalCents = 0;
	let sunatDueDate = "";

	for (const r of percepciones) {
		byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
		if (r.status !== "CANCELLED") {
			totalCents += r.percepcionAmount.getCents();
		}
		if (!sunatDueDate) {
			sunatDueDate = r.sunatDueDate.toISOString().slice(0, 10);
		}
	}

	return {
		declarationPeriod: input.declarationPeriod,
		sunatDueDate,
		totalPercepcionAmount: totalCents / 100,
		percepcionCount: percepciones.filter((r) => r.status !== "CANCELLED")
			.length,
		byStatus: byStatus as PercepcionSummaryResult["byStatus"],
	};
}
