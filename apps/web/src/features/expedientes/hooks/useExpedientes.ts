import type {
	CierreMensual,
	ExpedienteFiscal,
	ExpedienteKind,
} from "@drenyra/domain";
import { useQuery } from "@tanstack/react-query";
import { extractOkData } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

function buildHeaders(companyId: string, companyRuc: string): HeadersInit {
	return {
		"X-Company-Id": companyId,
		"X-Company-Ruc": companyRuc,
	};
}

async function fetchExpedientes(input: {
	companyId: string;
	companyRuc: string;
	kind?: ExpedienteKind;
	periodo?: string;
}): Promise<ExpedienteFiscal[]> {
	const params = new URLSearchParams({ companyRuc: input.companyRuc });
	if (input.kind) params.set("kind", input.kind);
	if (input.periodo) params.set("periodo", input.periodo);

	const response = await fetch(`/api/expedientes?${params.toString()}`, {
		headers: buildHeaders(input.companyId, input.companyRuc),
		credentials: "include",
	});
	return extractOkData(await response.json(), "Failed to load expedientes");
}

async function fetchCierreMensual(input: {
	companyId: string;
	companyRuc: string;
	periodo?: string;
}): Promise<CierreMensual> {
	const params = new URLSearchParams({ companyRuc: input.companyRuc });
	if (input.periodo) params.set("periodo", input.periodo);

	const response = await fetch(
		`/api/expedientes/cierre-mensual/current?${params.toString()}`,
		{
			headers: buildHeaders(input.companyId, input.companyRuc),
			credentials: "include",
		},
	);
	return extractOkData(await response.json(), "Failed to load expedientes");
}

export function useExpedientes(filters?: {
	kind?: ExpedienteKind;
	periodo?: string;
}) {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";
	const companyRuc = companyContext.ruc ?? "";

	return useQuery({
		queryKey: [
			"expedientes",
			companyId,
			companyRuc,
			filters?.kind,
			filters?.periodo,
		],
		queryFn: () =>
			fetchExpedientes({
				companyId,
				companyRuc,
				kind: filters?.kind,
				periodo: filters?.periodo,
			}),
		enabled: Boolean(companyId && companyRuc),
	});
}

export function useCierreMensual(periodo?: string) {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";
	const companyRuc = companyContext.ruc ?? "";

	return useQuery({
		queryKey: ["cierre-mensual", companyId, companyRuc, periodo],
		queryFn: () => fetchCierreMensual({ companyId, companyRuc, periodo }),
		enabled: Boolean(companyId && companyRuc),
	});
}
