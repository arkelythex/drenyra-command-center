import type { ExpedienteKind } from "@drenyra/domain";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const EXPEDIENTE_KINDS = [
	"CIERRE_MENSUAL",
	"SIRE_COMPRAS",
	"SIRE_VENTAS",
	"CONCILIACION_BANCARIA",
	"AUDITORIA_FISCAL",
	"DECLARACION_JURADA",
	"DETRACCIONES",
	"PERCEPCIONES",
	"RETENCIONES",
	"GENERAL",
] as const satisfies readonly ExpedienteKind[];

function parseExpedienteKind(value: unknown): ExpedienteKind | undefined {
	return typeof value === "string" &&
		(EXPEDIENTE_KINDS as readonly string[]).includes(value)
		? (value as ExpedienteKind)
		: undefined;
}

export const Route = createFileRoute("/cumplimiento/expedientes")({
	validateSearch: (search: Record<string, unknown>) => ({
		periodo: typeof search.periodo === "string" ? search.periodo : undefined,
		kind: parseExpedienteKind(search.kind),
		q: typeof search.q === "string" ? search.q : undefined,
	}),
	component: lazyRouteComponent(
		() => import("../../features/expedientes/ExpedientesPage"),
		"ExpedientesPage",
	),
});
