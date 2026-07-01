import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
	Calculator,
	ChevronRight,
	Clock3,
	FileSearch,
	PanelLeftClose,
	PanelLeftOpen,
	ShieldCheck,
} from "lucide-react";
import React from "react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { cn } from "@/lib/utils";

interface HubRadarAsideProps {
	onAction: (command: string) => void;
}

export const HubRadarAside = ({ onAction }: HubRadarAsideProps) => {
	const { companyContext } = useActiveCompanyContext();
	const [isCollapsed, setIsCollapsed] = React.useState(false);

	return (
		<motion.aside
			initial={false}
			animate={{ width: isCollapsed ? 64 : 320 }}
			className="relative hidden shrink-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--surface-1)] lg:flex overflow-hidden transition-all duration-300 ease-in-out shadow-[-10px_0_30px_rgba(0,0,0,0.02)]"
		>
			{/* Toggle Button - Now on the left side */}
			<button
				type="button"
				onClick={() => setIsCollapsed(!isCollapsed)}
				className="absolute left-4 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-primary transition-colors"
				aria-label={isCollapsed ? "Expandir radar" : "Colapsar radar"}
			>
				{isCollapsed ? (
					<PanelLeftClose size={16} strokeWidth={1.5} />
				) : (
					<PanelLeftOpen size={16} strokeWidth={1.5} />
				)}
			</button>

			<AnimatePresence mode="wait">
				{!isCollapsed ? (
					<motion.div
						key="expanded"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-8 p-6 pl-14 overflow-y-auto no-scrollbar h-full"
					>
						{/* Empresa Contexto */}
						<div className="space-y-1 pr-8">
							<p className="text-xs font-black uppercase tracking-[0.2em] text-muted">
								Empresa Activa
							</p>
							<h2 className="text-sm font-bold text-primary leading-tight truncate">
								{companyContext.companyName}
							</h2>
							<div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase">
								<Clock3 size={10} className="text-[var(--accent)]" />
								Abril 2026
							</div>
						</div>

						{/* Riesgo Vertical */}
						<div className="space-y-3">
							<p className="text-xs font-black uppercase tracking-[0.2em] text-muted">
								Riesgo Fiscal
							</p>
							<div className="rounded-2xl border border-border/40 bg-white/[0.02] p-4 space-y-3">
								<div className="flex items-baseline gap-1">
									<span className="text-3xl font-black text-primary">742</span>
									<span className="text-xs font-bold text-muted">/ 1000</span>
								</div>
								<div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden">
									<div className="h-full w-[74%] rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
								</div>
								<p className="text-xs font-bold text-amber-600 leading-snug">
									Medio: Revisión SIRE recomendada
								</p>
							</div>
						</div>

						{/* Cierre Mensual */}
						<div className="space-y-3">
							<p className="text-xs font-black uppercase tracking-[0.2em] text-muted">
								Cierre Mensual
							</p>
							<div className="rounded-2xl border border-border/40 bg-white/[0.02] p-4 space-y-3">
								<div className="text-3xl font-black text-primary">68%</div>
								<div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden">
									<div className="h-full w-[68%] rounded-full bg-success shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
								</div>
								<p className="text-xs font-bold text-success leading-snug">
									12 / 18 tareas completadas
								</p>
							</div>
						</div>

						{/* Discrepancias en Lista */}
						<div className="space-y-3">
							<p className="text-xs font-black uppercase tracking-[0.2em] text-muted">
								Discrepancias
							</p>
							<div className="space-y-2">
								<Link to="/cumplimiento/sire-diff" className="block">
									<RadarSmallCard
										icon={FileSearch}
										title="SIRE"
										count={3}
										tone="warning"
									/>
								</Link>
								<RadarSmallCard
									icon={ShieldCheck}
									title="CPE"
									count={2}
									tone="danger"
									onClick={() => onAction("Validar CPE")}
								/>
								<RadarSmallCard
									icon={Calculator}
									title="Bancos"
									count="S/ 18k"
									tone="info"
									onClick={() => onAction("Conciliación")}
								/>
							</div>
						</div>

						{/* Footer del Rail */}
						<div className="mt-auto pt-6 border-t border-border/40">
							<div className="flex items-center gap-3 rounded-xl bg-success-subtle p-3 border border-success-subtle">
								<div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
								<span className="text-xs font-black uppercase tracking-widest text-success leading-none">
									Shadow SUNAT Engine
								</span>
							</div>
						</div>
					</motion.div>
				) : (
					<motion.div
						key="collapsed"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="flex flex-col items-center gap-8 py-20 h-full"
					>
						<div className="flex flex-col gap-6">
							<button
								type="button"
								className="flex flex-col items-center gap-1 group cursor-pointer"
								onClick={() => setIsCollapsed(false)}
							>
								<div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
								<span className="text-xs font-black text-primary group-hover:text-[var(--accent)] transition-colors">
									742
								</span>
							</button>
							<button
								type="button"
								className="flex flex-col items-center gap-1 group cursor-pointer"
								onClick={() => setIsCollapsed(false)}
							>
								<div className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
								<span className="text-xs font-black text-primary group-hover:text-[var(--accent)] transition-colors">
									68%
								</span>
							</button>
						</div>
						<div className="flex flex-col gap-4 border-t border-border/40 pt-8">
							<FileSearch
								size={18}
								className="text-muted hover:text-primary transition-colors cursor-pointer"
								onClick={() => setIsCollapsed(false)}
							/>
							<ShieldCheck
								size={18}
								className="text-muted hover:text-primary transition-colors cursor-pointer"
								onClick={() => setIsCollapsed(false)}
							/>
							<Calculator
								size={18}
								className="text-muted hover:text-primary transition-colors cursor-pointer"
								onClick={() => setIsCollapsed(false)}
							/>
						</div>
						<div className="mt-auto pb-8">
							<div className="h-2 w-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.aside>
	);
};

interface RadarSmallCardProps {
	icon: React.ComponentType<{ className?: string; size?: number }>;
	title: string;
	count: string | number;
	tone: "warning" | "danger" | "info";
	onClick?: () => void;
}

function RadarSmallCard({
	icon: Icon,
	title,
	count,
	tone,
	onClick,
}: RadarSmallCardProps) {
	const toneColors = {
		warning: "text-amber-500",
		danger: "text-red-500",
		info: "text-info",
	};

	return (
		<button
			type="button"
			onClick={onClick}
			className="group flex w-full items-center justify-between rounded-xl border border-transparent p-2 transition-all hover:bg-white/5 hover:border-border/40"
		>
			<div className="flex items-center gap-3">
				<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/10 group-hover:bg-primary/10">
					<Icon
						size={14}
						className="text-muted group-hover:text-primary transition-colors"
					/>
				</div>
				<span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">
					{title}
				</span>
			</div>
			<div className="flex items-center gap-2">
				<span
					className={cn(
						"text-xs font-black",
						toneColors[tone as keyof typeof toneColors],
					)}
				>
					{count}
				</span>
				<ChevronRight
					size={10}
					className="text-muted opacity-0 group-hover:opacity-100 transition-opacity"
				/>
			</div>
		</button>
	);
}
