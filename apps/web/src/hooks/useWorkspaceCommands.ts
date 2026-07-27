import { useEffect } from "react";
import {
	commandRegistry,
	type Command,
} from "../lib/commands/command-registry";
import { useWorkspace } from "../contexts/workspace-context";

const WORKSPACE_GROUP = "workspace-context";

/**
 * useWorkspaceCommands — registers workspace-aware query commands
 * whenever the workspace changes.
 *
 * Unregisters old workspace commands when workspace changes.
 * Query commands open a result view (placeholder for now).
 */
export function useWorkspaceCommands() {
	const { workspace } = useWorkspace();

	useEffect(() => {
		// Unregister previous workspace commands
		commandRegistry.unregisterGroup(WORKSPACE_GROUP);

		if (!workspace) return;

		const company = workspace.company;
		const period = workspace.period;

		const queryCommands: Command[] = [
			{
				id: `query-igv-${workspace.id}`,
				label: "Explicar variación IGV",
				description: `Analizar variación de IGV para ${company.name} en ${period.label}`,
				category: "query",
				keywords: ["igv", "impuesto", "variacion", "diferencia", company.name],
				execute: () => {
					window.dispatchEvent(
						new CustomEvent("query:igv-variation", {
							detail: { company, period },
						}),
					);
				},
			},
			{
				id: `query-unusual-${workspace.id}`,
				label: "Encontrar asientos inusuales",
				description: `Buscar asientos contables inusuales en ${period.label}`,
				category: "query",
				keywords: ["asientos", "inusual", "anomalo", "diario", company.name],
				execute: () => {
					window.dispatchEvent(
						new CustomEvent("query:unusual-entries", {
							detail: { company, period },
						}),
					);
				},
			},
			{
				id: `query-compare-${workspace.id}`,
				label: `Comparar ${period.label} con periodo anterior`,
				description: `Comparar estado financiero actual con período anterior para ${company.name}`,
				category: "query",
				keywords: ["comparar", "vs", "anterior", "diferencia", company.name],
				execute: () => {
					window.dispatchEvent(
						new CustomEvent("query:compare-periods", {
							detail: { company, period },
						}),
					);
				},
			},
			{
				id: `query-summary-${workspace.id}`,
				label: `Resumen de ${period.label}`,
				description: `Resumen ejecutivo del período para ${company.name}`,
				category: "query",
				keywords: ["resumen", "summary", "ejecutivo", company.name],
				execute: () => {
					window.dispatchEvent(
						new CustomEvent("query:period-summary", {
							detail: { company, period },
						}),
					);
				},
			},
			{
				id: `query-reconcile-${workspace.id}`,
				label: "Buscar discrepancias en conciliación",
				description: "Detectar diferencias entre ledger y RCE",
				category: "query",
				keywords: [
					"conciliacion",
					"discrepancia",
					"diferencia",
					"rce",
					"ledger",
				],
				execute: () => {
					window.dispatchEvent(
						new CustomEvent("query:reconcile-discrepancies", {
							detail: { company, period },
						}),
					);
				},
			},
		];

		commandRegistry.registerMany(queryCommands, WORKSPACE_GROUP);

		return () => {
			commandRegistry.unregisterGroup(WORKSPACE_GROUP);
		};
	}, [workspace]);
}
