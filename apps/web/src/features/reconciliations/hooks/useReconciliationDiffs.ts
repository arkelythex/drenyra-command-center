import { useQuery } from "@tanstack/react-query";
import { extractOkData } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

export interface ReconciliationDiffEntry {
	id: string;
	bankMovement: string;
	amount: number;
	proposedMatch: string;
	confidence: 1 | 2 | 3;
	evidence: string;
}

export function useReconciliationDiffs() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";

	return useQuery({
		queryKey: ["reconciliation-diffs", companyId],
		queryFn: async (): Promise<ReconciliationDiffEntry[]> => {
			const params = new URLSearchParams({ companyId, limit: "20" });
			const res = await fetch(
				`/api/reconciliations/pending?${params.toString()}`,
				{ credentials: "include" },
			);
			const pending = (await extractOkData(
				await res.json(),
				"Failed to load pending reconciliations",
			)) as Array<{
				id: string;
				description?: string;
				amount?: string;
				reference?: string;
				transactionDate?: string;
			}>;

			return pending.map((tx, index) => ({
				id: tx.id,
				bankMovement: `${tx.description ?? "Movimiento bancario"} · ${tx.transactionDate ?? "—"} · ${tx.reference ?? ""}`,
				amount: tx.amount ? Number.parseFloat(tx.amount) : 0,
				proposedMatch: `Transacción ${tx.reference ?? tx.id} · Pendiente de conciliar`,
				confidence: (index === 0 ? 3 : 2) as 1 | 2 | 3,
				evidence: tx.reference
					? `Referencia: ${tx.reference}. Monto: S/ ${tx.amount ?? "—"}.`
					: "Sin referencia vinculada. Revisión manual recomendada.",
			}));
		},
		enabled: Boolean(companyId),
	});
}
