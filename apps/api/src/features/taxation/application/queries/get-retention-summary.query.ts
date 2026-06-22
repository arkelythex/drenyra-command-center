import { retencionRepository } from "../../infrastructure/retencion.repository";

export interface GetRetentionSummaryInput {
	companyId: string;
	declarationPeriod: string;
}

export interface RetentionSummaryResult {
	declarationPeriod: string;
	sunatDueDate: string;
	totalRetentionAmount: number;
	retentionCount: number;
	byStatus: Record<"PENDING" | "DECLARED" | "PAID" | "CANCELLED", number>;
}

export async function getRetentionSummary(
	input: GetRetentionSummaryInput,
): Promise<RetentionSummaryResult> {
	const repo = retencionRepository;

	const retenciones = await repo.findByDeclarationPeriod(
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

	for (const r of retenciones) {
		byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
		if (r.status !== "CANCELLED") {
			totalCents += r.retentionAmount.getCents();
		}
		if (!sunatDueDate) {
			sunatDueDate = r.sunatDueDate.toISOString().slice(0, 10);
		}
	}

	return {
		declarationPeriod: input.declarationPeriod,
		sunatDueDate,
		totalRetentionAmount: totalCents / 100,
		retentionCount: retenciones.filter((r) => r.status !== "CANCELLED").length,
		byStatus: byStatus as RetentionSummaryResult["byStatus"],
	};
}
