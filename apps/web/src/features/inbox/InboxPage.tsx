import { useState } from "react";
import { Bot, CheckCircle2, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InboxState = "empty" | "processing" | "results";

interface ProcessingAgent {
	name: string;
	status: "completed" | "running" | "waiting";
	detail: string;
}

interface InboxResult {
	validos: number;
	revision: number;
	ilegibles: number;
}

const MOCK_AGENTS: ProcessingAgent[] = [
	{
		name: "Validador documental",
		status: "completed",
		detail: "12 archivos validados",
	},
	{
		name: "Clasificador contable",
		status: "running",
		detail: "8 / 12 procesados",
	},
	{ name: "Validador SUNAT", status: "waiting", detail: "En espera" },
];

export function InboxPage() {
	const [state, setState] = useState<InboxState>("empty");
	const [dragOver, setDragOver] = useState(false);
	const [results] = useState<InboxResult>({
		validos: 8,
		revision: 3,
		ilegibles: 1,
	});

	const handleSimulateUpload = () => {
		setState("processing");
		setTimeout(() => setState("results"), 3000);
	};

	return (
		<div className="flex h-full flex-col bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[800px] p-6 sm:p-10">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
						Inbox inteligente
					</h1>
					<p className="text-xs text-[var(--text-tertiary)] mt-1">
						Procesa comprobantes, detecta observaciones y prepara acciones.
					</p>
				</div>

				{/* Empty state: drag-drop zone */}
				{state === "empty" && (
					<div className="space-y-6">
						<button
							type="button"
							className={cn(
								"flex w-full flex-col items-center justify-center rounded-2xl border border-dashed p-8 transition-all cursor-pointer",
								dragOver
									? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
									: "border-[var(--border-default)] bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]/50",
							)}
							onDragOver={(e) => {
								e.preventDefault();
								setDragOver(true);
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={(e) => {
								e.preventDefault();
								setDragOver(false);
								handleSimulateUpload();
							}}
							onClick={handleSimulateUpload}
						>
							<div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
								<Upload size={20} className="text-[var(--color-primary)]" />
							</div>
							<p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
								Arrastra comprobantes o selecciona archivos
							</p>
							<p className="text-xs text-[var(--text-tertiary)] mb-4">
								PDF · XML · CDR · imágenes
							</p>
							<Button
								variant="outline"
								className="h-9 text-xs font-medium"
								onClick={handleSimulateUpload}
							>
								<Upload size={14} className="mr-2" />
								Seleccionar archivos
							</Button>
						</button>

						{/* Actividad reciente */}
						<div className="space-y-3">
							<h2 className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
								Actividad reciente
							</h2>
							<div className="space-y-1.5">
								<div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
									<div className="flex items-center gap-2 min-w-0">
										<span className="text-xs font-medium text-[var(--text-primary)] truncate">
											Facturas julio
										</span>
										<span className="text-2xs text-[var(--text-tertiary)]">
											428 archivos
										</span>
									</div>
									<span className="text-2xs font-semibold text-[var(--color-success)] shrink-0">
										Completado
									</span>
								</div>
								<div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
									<div className="flex items-center gap-2 min-w-0">
										<span className="text-xs font-medium text-[var(--text-primary)] truncate">
											Compras recurrentes
										</span>
										<span className="text-2xs text-[var(--text-tertiary)]">
											34 archivos
										</span>
									</div>
									<span className="text-2xs font-semibold text-[var(--color-warning)] shrink-0">
										Revisión
									</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Processing state */}
				{state === "processing" && (
					<div className="space-y-6">
						<div className="flex items-center gap-3">
							<Bot
								size={20}
								className="text-[var(--color-info)] animate-pulse"
							/>
							<div>
								<p className="text-sm font-semibold text-[var(--text-primary)]">
									12 archivos cargados
								</p>
								<p className="text-xs text-[var(--text-tertiary)]">
									Procesando…
								</p>
							</div>
						</div>

						{/* Progress bar */}
						<div className="h-2 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
							<div
								className="h-full rounded-full bg-[var(--color-info)] animate-pulse transition-all duration-1000"
								style={{ width: "66%" }}
							/>
						</div>

						{/* Agent progress */}
						<div className="space-y-3">
							{MOCK_AGENTS.map((agent) => (
								<div
									key={agent.name}
									className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3"
								>
									<div className="flex items-center gap-3 min-w-0">
										<Bot
											size={14}
											className={cn(
												"shrink-0",
												agent.status === "completed" &&
													"text-[var(--color-success)]",
												agent.status === "running" &&
													"text-[var(--color-info)] animate-pulse",
												agent.status === "waiting" &&
													"text-[var(--text-quaternary)]",
											)}
										/>
										<div className="min-w-0">
											<p className="text-xs font-medium text-[var(--text-primary)] truncate">
												{agent.name}
											</p>
											<p className="text-2xs text-[var(--text-tertiary)]">
												{agent.detail}
											</p>
										</div>
									</div>
									<span
										className={cn(
											"shrink-0 text-2xs font-semibold",
											agent.status === "completed" &&
												"text-[var(--color-success)]",
											agent.status === "running" && "text-[var(--color-info)]",
											agent.status === "waiting" &&
												"text-[var(--text-quaternary)]",
										)}
									>
										{agent.status === "completed" && "Completado"}
										{agent.status === "running" && "En ejecución"}
										{agent.status === "waiting" && "En espera"}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Results state */}
				{state === "results" && (
					<div className="space-y-6">
						<div className="flex items-center gap-3">
							<CheckCircle2 size={20} className="text-[var(--color-success)]" />
							<div>
								<p className="text-sm font-semibold text-[var(--text-primary)]">
									Procesamiento completado
								</p>
								<p className="text-xs text-[var(--text-tertiary)]">
									12 archivos procesados
								</p>
							</div>
						</div>

						{/* Result cards */}
						<div className="grid grid-cols-3 gap-3">
							<ResultCard
								label="Válidos"
								value={results.validos}
								color="text-[var(--color-success)]"
								bg="bg-[var(--color-success)]/5"
							/>
							<ResultCard
								label="Requieren revisión"
								value={results.revision}
								color="text-[var(--color-warning)]"
								bg="bg-[var(--color-warning)]/5"
							/>
							<ResultCard
								label="Ilegibles"
								value={results.ilegibles}
								color="text-[var(--color-danger)]"
								bg="bg-[var(--color-danger)]/5"
							/>
						</div>

						{/* Contextual actions — appear AFTER processing */}
						<div className="space-y-2">
							<p className="text-2xs font-bold uppercase tracking-wider text-[var(--text-quaternary)]">
								Acciones sugeridas
							</p>
							<div className="flex flex-wrap gap-2">
								<Button
									size="sm"
									variant="outline"
									className="h-8 text-xs font-semibold"
								>
									<FileText size={14} className="mr-1.5" />
									Explicar los 3 errores
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="h-8 text-xs font-semibold"
								>
									Calcular IGV preliminar
								</Button>
								<Button size="sm" className="h-8 text-xs font-semibold">
									<Bot size={14} className="mr-1.5" />
									Preparar revisión humana
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function ResultCard({
	label,
	value,
	color,
	bg,
}: {
	label: string;
	value: number;
	color: string;
	bg: string;
}) {
	return (
		<div
			className={cn(
				"rounded-xl border border-[var(--border-subtle)] p-4 text-center",
				bg,
			)}
		>
			<p className={cn("text-2xl font-bold", color)}>{value}</p>
			<p className="text-2xs text-[var(--text-tertiary)] mt-1">{label}</p>
		</div>
	);
}
