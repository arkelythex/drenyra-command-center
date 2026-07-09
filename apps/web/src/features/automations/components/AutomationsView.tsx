import {
	Activity,
	Clock3,
	History,
	Pause,
	Play,
	Settings2,
	Sparkles,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Automation {
	id: string;
	title: string;
	description: string;
	lastRun: string;
	status: "running" | "idle" | "paused";
	trigger: "Schedule" | "Event" | "Manual";
	riskLevel: "Low" | "Medium" | "High";
}

const AUTOMATIONS: Automation[] = [
	{
		id: "monthly-close",
		title: "Cierre Mensual Asistido",
		description:
			"Ejecuta conciliación, valida SIRE y genera borrador de declaración mensual.",
		lastRun: "Hace 2 días",
		status: "idle",
		trigger: "Manual",
		riskLevel: "High",
	},
	{
		id: "daily-sync",
		title: "Sincronización Diaria SUNAT",
		description:
			"Descarga de nuevos CPEs y validación de estados RUC de proveedores.",
		lastRun: "Hoy 7:00 AM",
		status: "running",
		trigger: "Schedule",
		riskLevel: "Low",
	},
	{
		id: "bank-recon",
		title: "Auto-Conciliación Bancaria",
		description:
			"Match automático de movimientos bancarios con facturas aprobadas.",
		lastRun: "Hoy 9:45 AM",
		status: "running",
		trigger: "Event",
		riskLevel: "Medium",
	},
	{
		id: "ruc-watcher",
		title: "Vigilancia de Proveedores",
		description:
			"Monitoreo constante de condición Habido/No Hallado de cartera de proveedores.",
		lastRun: "Ayer",
		status: "idle",
		trigger: "Schedule",
		riskLevel: "Low",
	},
];

export const AutomationsView = () => {
	return (
		<div className="flex flex-col h-full bg-white">
			{/* --- HEADER --- */}
			<header className="px-8 py-12 lg:px-16 border-b border-gray-50">
				<div className="max-w-5xl mx-auto flex items-end justify-between gap-8">
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-orange-50 text-orange-600">
								<Clock3 size={24} strokeWidth={2.5} />
							</div>
							<h1 className="text-3xl font-bold tracking-tight text-primary">
								Automations
							</h1>
						</div>
						<p className="text-secondary text-lg max-w-xl">
							Gestiona las rutinas y agentes que operan ARKELYTHEX de forma
							autónoma bajo tu supervisión.
						</p>
					</div>

					<button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95">
						<Sparkles size={18} />
						Nueva Automatización
					</button>
				</div>
			</header>

			{/* --- DASHBOARD --- */}
			<main className="flex-1 overflow-y-auto p-8 lg:p-16 bg-[#F9F9FB]">
				<div className="max-w-5xl mx-auto space-y-8">
					{/* Status Stats */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<StatCard
							label="En Ejecución"
							value="2"
							icon={Activity}
							color="text-blue-600"
						/>
						<StatCard
							label="Ejecutadas Hoy"
							value="14"
							icon={History}
							color="text-[var(--color-success)]"
						/>
						<StatCard
							label="Alerta de Riesgo"
							value="0"
							icon={ShieldCheck}
							color="text-orange-600"
						/>
					</div>

					{/* Automation List */}
					<div className="space-y-4">
						<h2 className="text-xs font-bold text-secondary/40 uppercase tracking-[0.2em] px-4">
							Rutinas de Trabajo
						</h2>
						<div className="space-y-3">
							{AUTOMATIONS.map((auto) => (
								<AutomationRow key={auto.id} auto={auto} />
							))}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

interface StatCardProps {
	label: string;
	value: string;
	icon: React.ComponentType<{ className?: string; size?: number }>;
	color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
	return (
		<div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-between">
			<div className="space-y-1">
				<p className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
					{label}
				</p>
				<p className={cn("text-3xl font-black", color)}>{value}</p>
			</div>
			<div className={cn("p-3 rounded-2xl bg-gray-50", color)}>
				<Icon size={24} />
			</div>
		</div>
	);
}

function AutomationRow({ auto }: { auto: Automation }) {
	const isRunning = auto.status === "running";

	return (
		<div className="group flex items-center gap-6 p-4 pr-6 rounded-[1.5rem] border border-gray-100 bg-white hover:border-info-subtle hover:shadow-sm transition-all duration-300">
			<div
				className={cn(
					"p-3 rounded-xl transition-all",
					isRunning
						? "bg-blue-50 text-blue-600 animate-pulse"
						: "bg-gray-50 text-secondary/40 group-hover:bg-gray-100",
				)}
			>
				<Activity size={20} />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-3 mb-1">
					<h3 className="font-bold text-sm text-primary truncate">
						{auto.title}
					</h3>
					<Badge
						variant="outline"
						className="text-xs h-4 py-0 border-gray-100 uppercase tracking-wider"
					>
						{auto.trigger}
					</Badge>
					<Badge
						className={cn(
							"text-xs h-4 py-0 uppercase tracking-wider",
							auto.riskLevel === "High"
								? "bg-red-50 text-red-700"
								: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
						)}
					>
						Riesgo: {auto.riskLevel}
					</Badge>
				</div>
				<p className="text-xs text-secondary truncate">{auto.description}</p>
			</div>

			<div className="text-right hidden sm:block min-w-[100px]">
				<p className="text-xs font-bold text-secondary/40 uppercase tracking-widest mb-1">
					Última ejecución
				</p>
				<p className="text-xs font-bold text-primary">{auto.lastRun}</p>
			</div>

			<div className="flex items-center gap-2 ml-4">
				<button className="p-2 rounded-xl text-secondary hover:bg-gray-100 hover:text-primary transition-colors">
					<Settings2 size={18} />
				</button>
				<button
					className={cn(
						"p-2 rounded-xl transition-all shadow-sm",
						isRunning
							? "bg-orange-50 text-orange-600 hover:bg-orange-100"
							: "bg-blue-50 text-blue-600 hover:bg-blue-100",
					)}
				>
					{isRunning ? (
						<Pause size={18} fill="currentColor" />
					) : (
						<Play size={18} fill="currentColor" />
					)}
				</button>
			</div>
		</div>
	);
}

interface ShieldCheckProps {
	size?: number;
	className?: string;
}

function ShieldCheck({ size, className }: ShieldCheckProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}
