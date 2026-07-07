import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";
import type { QuickActionDTO } from "../threads.api";

interface ThreadCreatePageProps {
	quickActions?: QuickActionDTO[];
	onCreateThread?: (action: QuickActionDTO) => void;
}

const DEFAULT_QUICK_ACTIONS: QuickActionDTO[] = [
	{
		id: "close-month",
		label: "Cerrar mes",
		description:
			"Prepara declaración IGV, concilia bancos, revisa compras SIRE",
		category: "close",
		suggestedTasks: [
			{ title: "Validar SIRE compras" },
			{ title: "Conciliar bancos" },
			{ title: "Preparar declaración IGV" },
			{ title: "Revisar detracciones" },
			{ title: "Cerrar mes" },
		],
	},
	{
		id: "review-sire",
		label: "Revisar SIRE compras",
		description: "Cruza libros electrónicos con SUNAT y detecta diferencias",
		category: "sire",
		suggestedTasks: [
			{ title: "Extraer comprobantes del período" },
			{ title: "Comparar con registro SIRE" },
			{ title: "Generar reporte de diferencias" },
		],
	},
	{
		id: "reconcile-bank",
		label: "Conciliar bancos",
		description: "Empareja movimientos bancarios con asientos contables",
		category: "reconciliation",
		suggestedTasks: [
			{ title: "Importar extracto bancario" },
			{ title: "Emparejar movimientos" },
			{ title: "Marcar diferencias" },
		],
	},
	{
		id: "tax-risk",
		label: "Buscar riesgos fiscales",
		description:
			"Analiza gastos sin sustento, IGV observado, detracciones pendientes",
		category: "risk",
		suggestedTasks: [
			{ title: "Revisar gastos sin sustento" },
			{ title: "Verificar IGV crédito fiscal" },
			{ title: "Detectar detracciones pendientes" },
		],
	},
	{
		id: "request-docs",
		label: "Pedir documentos faltantes",
		description: "Identifica comprobantes faltantes y solicita al cliente",
		category: "compliance",
		suggestedTasks: [
			{ title: "Listar comprobantes faltantes" },
			{ title: "Generar solicitud al cliente" },
		],
	},
];

/**
 * ThreadCreatePage — "Let's Close" landing page.
 *
 * Shows quick actions contextuales para iniciar un thread contable.
 * Inspirado en Codex App: "What would you like to do?"
 */
export function ThreadCreatePage({
	quickActions,
	onCreateThread,
}: ThreadCreatePageProps) {
	const navigate = useNavigate();
	const [selectedCompany] = useState("Andrés Capital SAC");
	const [selectedPeriod] = useState("Jun 2026");

	const actions = quickActions ?? DEFAULT_QUICK_ACTIONS;

	return (
		<div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-16">
			{/* Header */}
			<div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
				<Building2 size={14} />
				<span>{selectedCompany}</span>
				<span>·</span>
				<Calendar size={14} />
				<span>{selectedPeriod}</span>
			</div>

			<h1 className="mb-8 text-center text-2xl font-semibold text-[var(--text-primary)]">
				Let's close
			</h1>

			{/* Quick action grid */}
			<div className="mb-8 grid w-full gap-3">
				{actions.map((action) => (
					<button
						key={action.id}
						type="button"
						onClick={() => {
							if (onCreateThread) {
								onCreateThread(action);
							} else {
								navigate({
									to: "/drenyra",
									search: { action: action.id } as never,
								});
							}
						}}
						className="group flex items-start gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--surface-2)]"
					>
						<Sparkles
							size={18}
							className="mt-0.5 flex-shrink-0 text-[var(--color-primary)]"
						/>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-[var(--text-primary)]">
								{action.label}
							</p>
							<p className="mt-0.5 text-xs text-[var(--text-muted)]">
								{action.description}
							</p>
						</div>
						<ArrowRight
							size={16}
							className="mt-0.5 flex-shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</button>
				))}
			</div>

			{/* Recent threads hint */}
			<p className="text-[11px] text-[var(--text-muted)]">
				Or type{" "}
				<kbd className="rounded-md border border-[var(--border-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
					@
				</kbd>{" "}
				to reference a document or{" "}
				<kbd className="rounded-md border border-[var(--border-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
					/
				</kbd>{" "}
				for a skill command
			</p>
		</div>
	);
}
