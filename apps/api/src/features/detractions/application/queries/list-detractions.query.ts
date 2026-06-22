import { db } from "@arkelythex/persistence/client";
import { desc, eq } from "@arkelythex/persistence/query";
import { detractions } from "@arkelythex/persistence/schema";

export interface ListDetractionsInput {
	companyId?: string;
	status?: "pendiente" | "depositado" | "usado" | "liberado";
}

export interface DetractionRow {
	id: string;
	reference: string | null;
	spotCode: string | null;
	percentage: number | null;
	amountCents: number | null;
	status: string | null;
	createdAt: string;
}

export async function listDetractions(
	input: ListDetractionsInput,
): Promise<DetractionRow[]> {
	const filters: Array<ReturnType<typeof eq>> = [];
	if (input.companyId) {
		filters.push(eq(detractions.companyId, input.companyId));
	}
	if (input.status) {
		filters.push(eq(detractions.status, input.status));
	}

	const rows = await db.query.detractions.findMany({
		where: filters.length > 0 ? filters.reduce((a, b) => a && b) : undefined,
		orderBy: [desc(detractions.createdAt)],
		limit: 100,
	});

	return rows.map((row) => ({
		id: row.id,
		reference: row.reference,
		spotCode: row.spotCode,
		percentage: row.percentage,
		amountCents: row.amountCents,
		status: row.status,
		createdAt: row.createdAt.toISOString(),
	}));
}
