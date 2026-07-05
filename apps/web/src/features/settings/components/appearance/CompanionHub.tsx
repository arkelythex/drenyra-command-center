import { Activity, BrainCircuit, Layers, ShieldCheck, Zap } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

export const CompanionHub = () => {
	const { settings, updateSettings } = useSettings();
	const currentLevel = settings.aiAutonomyLevel ?? 2;

	const AUTONOMY_LEVELS = [
		{
			level: 0,
			title: "Solo Lectura",
			description: "Agentes operan en modo pasivo. Sin capacidad de propuesta.",
			icon: ShieldCheck,
			tone: "info",
		},
		{
			level: 1,
			title: "Sugerencia",
			description:
				"Capacidad de detectar inconsistencias y emitir alertas técnicas.",
			icon: Activity,
			tone: "info",
		},
		{
			level: 2,
			title: "Preparación",
			description:
				"Generación de borradores y asientos contables para revisión humana.",
			icon: Layers,
			tone: "accent",
		},
		{
			level: 3,
			title: "Ejecución Reversible",
			description:
				"Acciones operativas que no afectan el cumplimiento fiscal final.",
			icon: Zap,
			tone: "warning",
		},
		{
			level: 4,
			title: "Aprobación Explícita",
			description:
				"Capacidad de cierre y envío bajo validación biométrica/firma.",
			icon: BrainCircuit,
			tone: "danger",
		},
	];

	const getToneColor = (tone: string, active: boolean) => {
		if (!active) return "text-muted";
		if (tone === "info") return "text-info";
		if (tone === "accent") return "text-[var(--accent)]";
		if (tone === "warning") return "text-amber-500";
		if (tone === "danger") return "text-red-500";
		return "text-muted";
	};

	const getBgColor = (tone: string, active: boolean) => {
		if (!active) return "bg-white/[0.01]";
		if (tone === "info") return "bg-info-subtle";
		if (tone === "accent") return "bg-[var(--accent)]/5";
		if (tone === "warning") return "bg-amber-500/5";
		if (tone === "danger") return "bg-red-500/5";
		return "bg-white/[0.01]";
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between px-2">
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"h-2.5 w-2.5 rounded-full animate-pulse",
							currentLevel < 3
								? "bg-[var(--color-success)] shadow-[0_0_10px_rgba(16,185,129,0.5)]"
								: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
						)}
					/>
					<div className="flex flex-col">
						<span className="text-xs font-black uppercase tracking-[0.25em] text-primary">
							Protocolo de Autonomía Agéntica
						</span>
						<p className="text-xs font-bold text-muted uppercase tracking-tighter mt-0.5">
							Configuración de delegación ARKELYTHEX v1.0
						</p>
					</div>
				</div>
				<div className="flex flex-col items-end">
					<span
						className={cn(
							"text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
							currentLevel < 3
								? "text-[var(--color-success)] border-[var(--color-success)]/20 bg-[var(--color-success)]/5"
								: "text-red-500 border-red-500/20 bg-red-500/5",
						)}
					>
						{currentLevel < 3 ? "Riesgo Controlado" : "Acceso Elevado"}
					</span>
				</div>
			</div>

			<div className="grid gap-3">
				{AUTONOMY_LEVELS.map((item) => {
					const isActive = currentLevel === item.level;
					const Icon = item.icon;

					return (
						<button
							key={item.level}
							type="button"
							onClick={() =>
								updateSettings({
									...settings,
									aiAutonomyLevel: item.level,
								})
							}
							className={cn(
								"group relative flex items-center gap-6 rounded-3xl border p-5 text-left transition-all duration-300",
								isActive
									? "border-primary/20 shadow-xl ring-1 ring-primary/5"
									: "border-border/40 bg-white/[0.01] hover:bg-white/[0.03] grayscale hover:grayscale-0",
							)}
						>
							<div
								className={cn(
									"flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
									isActive
										? "border-primary/20"
										: "border-border/40 bg-muted/5",
									getBgColor(item.tone, isActive),
								)}
							>
								<Icon
									size={28}
									strokeWidth={isActive ? 2.5 : 1.5}
									className={getToneColor(item.tone, isActive)}
								/>
							</div>

							<div className="flex-1 space-y-1">
								<div className="flex items-center justify-between">
									<h5
										className={cn(
											"text-[13px] font-black uppercase tracking-widest",
											isActive ? "text-primary" : "text-muted",
										)}
									>
										Nivel {item.level}: {item.title}
									</h5>
									{isActive && (
										<span
											className={cn(
												"rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-widest border",
												item.tone === "danger"
													? "bg-red-500 text-white border-red-600"
													: "bg-primary text-primary-foreground border-primary/20",
											)}
										>
											Activo
										</span>
									)}
								</div>
								<p className="text-xs font-medium leading-relaxed text-secondary/70">
									{item.description}
								</p>
							</div>
						</button>
					);
				})}
			</div>

			<div
				className={cn(
					"rounded-2xl border p-5 transition-all duration-500",
					currentLevel >= 3
						? "border-red-500/20 bg-red-500/5 shadow-lg shadow-red-500/5"
						: "border-amber-500/20 bg-amber-500/5",
				)}
			>
				<div className="flex items-start gap-4">
					<ShieldCheck
						className={cn(
							"shrink-0",
							currentLevel >= 3 ? "text-red-500" : "text-amber-500",
						)}
						size={18}
					/>
					<div className="space-y-1">
						<p
							className={cn(
								"text-xs font-black uppercase tracking-widest",
								currentLevel >= 3 ? "text-red-600" : "text-amber-600",
							)}
						>
							Protocolo de Seguridad ARKELYTHEX
						</p>
						<p className="text-xs font-medium text-secondary/80 leading-relaxed">
							{currentLevel < 3
								? "Los niveles actuales operan bajo supervisión humana directa. Las propuestas deben ser aprobadas manualmente en el Motor de Evidencia."
								: "ADVERTENCIA: Has activado niveles de ejecución. ARKELYTHEX requerirá firma electrónica y validación de identidad para cada acción de cierre fiscal."}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
