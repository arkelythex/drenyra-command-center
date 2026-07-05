import { AlertTriangle, PackageSearch, Search, Warehouse } from "lucide-react";
import { useState } from "react";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	AnimatedNumber,
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { cn, n } from "@/lib/utils";
import { useInventory } from "../hooks/useInventory";
import { usePredictions } from "../hooks/usePredictions";
// Widgets
import { AIStockRadar } from "./widgets/AIStockRadar";
import { CostStructure } from "./widgets/CostStructure";
import { LiveKardex } from "./widgets/LiveKardex";
import { SmartProcurement } from "./widgets/SmartProcurement";

const PEN_FORMATTER = n;

export const InventoryView = () => {
	const { movements, metrics } = useInventory();
	const { predictions } = usePredictions();
	const [activeTab, setActiveTab] = useState("resumen");
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<div className="h-full flex flex-col bg-[var(--bg-0)] font-sans text-foreground overflow-hidden relative">
			{/* 📱 MOBILE: Floating Navigation Dock */}
			<MobileTabNavigation
				tabs={[
					{ id: "resumen", label: "Resumen" },
					{ id: "operaciones", label: "Operaciones" },
					{ id: "finanzas", label: "Finanzas" },
				]}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				className="left-auto right-4 top-4 z-[60]"
			/>

			{/* 📱 MOBILE: Toolbar (Search + Actions) */}
			<div className="relative z-40 mt-14 flex flex-col gap-6 border-b border-[var(--border-default)] bg-[var(--bg-1)] px-4 py-4 shadow-md sm:hidden">
				<div className="flex gap-3 w-full items-center">
					<div className="relative group flex-1">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors duration-200 group-focus-within:text-primary" />
						<input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Buscar SKU o movimiento"
							aria-label="Buscar producto"
							className="h-12 w-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] pl-12 text-sm font-semibold uppercase tracking-tight shadow-inner transition-[border-color,box-shadow,background-color,color] duration-200 placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
						/>
					</div>

					<Button
						variant="outline"
						size="icon"
						aria-label="Almacén"
						className="h-12 w-12 rounded-2xl border-border shadow-md hover:bg-muted/70"
					>
						<Warehouse size={18} />
					</Button>
				</div>
			</div>

			{/* Header */}
			<header className="relative z-40 hidden shrink-0 flex-col items-center justify-between gap-6 border-b border-[var(--border-default)] bg-[var(--bg-1)] px-6 py-6 shadow-md sm:flex md:flex-row">
				<div className="flex items-center gap-6 relative z-10 w-full md:w-auto group">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] text-primary shadow-sm transition-[border-color,background-color] duration-200 group-hover:border-primary/20 group-hover:bg-black/5 dark:group-hover:bg-white/5">
						<PackageSearch size={28} strokeWidth={2.5} />
					</div>
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl font-black tracking-tight text-foreground leading-none mb-2">
							Control de Existencias
						</h1>
						<div className="flex items-center gap-3">
							<Badge variant="info" className="h-6 gap-2">
								<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
								Operación en línea
							</Badge>
							<span className="text-2xs font-bold text-muted-foreground/70 uppercase tracking-[0.16em]">
								Corte operativo
							</span>
						</div>
					</div>
				</div>

				<div className="flex flex-row items-center gap-4 w-full md:w-auto relative z-10">
					{/* KPI Summary (Elite Precision) */}
					<div className="hidden xl:flex items-center gap-10 px-8 border-r border-border font-mono">
						<div className="text-right space-y-1">
							<span className="block text-3xs font-black uppercase tracking-widest text-muted-foreground/50">
								Valor total
							</span>
							<AnimatedNumber
								value={parseFloat(
									metrics.totalValorization.replace(/[^0-9.]/g, ""),
								)}
								formatter={PEN_FORMATTER}
								className="text-lg font-black tracking-tighter text-foreground tabular-nums"
							/>
						</div>
						<div className="text-right space-y-1">
							<span className="block text-3xs font-black uppercase tracking-widest text-muted-foreground/50">
								Rotación
							</span>
							<p className="text-lg font-black tracking-tighter text-primary tabular-nums">
								{metrics.rotationRate}
							</p>
						</div>
					</div>

					<Button
						variant="outline"
						className="h-12 rounded-2xl border-border px-8 text-2xs font-black uppercase tracking-[0.2em] text-foreground shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-200 hover:bg-muted/70 hover:shadow-md"
					>
						<Warehouse size={16} className="mr-3 text-primary" />
						<span>Almacenes</span>
					</Button>
					<Button className="h-12 rounded-2xl bg-primary px-8 text-2xs font-black uppercase tracking-[0.2em] text-primary-foreground shadow-lg shadow-primary/15 transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl active:scale-95">
						<AlertTriangle size={16} className="mr-3" />
						<span>Registrar Ajuste</span>
					</Button>
				</div>
			</header>

			{/* Content Grid */}
			<MotionDiv
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				className="flex-1 px-6 sm:px-10 lg:px-14 py-8 sm:py-10 flex flex-col lg:flex-row gap-8 overflow-y-auto lg:overflow-hidden bg-transparent custom-scrollbar relative z-10 pb-40"
			>
				{/* Left Column: Live Operations & Radar */}
				<div
					className={cn(
						"lg:flex-[2] flex-col gap-8 lg:overflow-hidden h-full",
						activeTab === "resumen" || activeTab === "operaciones"
							? "flex"
							: "hidden lg:flex",
					)}
				>
					<MotionDiv
						variants={entranceVariants}
						className={cn(
							"shrink-0",
							activeTab === "resumen" ? "block" : "hidden lg:block",
						)}
					>
						<div className="relative overflow-hidden rounded-3xl border border-border shadow-xl shadow-primary/5">
							<AIStockRadar predictions={predictions} />
						</div>
					</MotionDiv>

					<MotionDiv
						variants={entranceVariants}
						className={cn(
							"relative flex min-h-[450px] flex-1 flex-col overflow-hidden rounded-4xl border border-[var(--border-default)] bg-[var(--surface-1)] shadow-xl group",
							activeTab === "operaciones" ? "flex" : "hidden lg:flex",
						)}
					>
						<div className="px-10 py-8 border-b border-border flex flex-col sm:flex-row justify-between items-center bg-muted/40 gap-6">
							<div className="flex flex-col gap-1">
								<h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-3">
									<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
									Movimientos recientes
								</h2>
								<p className="text-2xs font-medium text-muted-foreground/60 uppercase tracking-widest pl-5">
									Kardex operativo por almacén
								</p>
							</div>
							<div className="flex bg-muted/60 p-1 rounded-xl border border-border shadow-inner">
								{["Entradas", "Salidas", "Transferencias"].map((filter) => (
									<button
										key={filter}
										className="h-8 rounded-lg px-5 text-3xs font-black uppercase tracking-widest text-muted-foreground/70 transition-[background-color,color] duration-200 hover:bg-muted/70 hover:text-foreground"
									>
										{filter}
									</button>
								))}
							</div>
						</div>
						<div className="flex-1 overflow-hidden relative">
							<div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] pointer-events-none" />
							<LiveKardex movements={movements} />
						</div>
					</MotionDiv>
				</div>

				{/* Right Column: Financial Analysis */}
				<div
					className={cn(
						"lg:flex-1 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar pr-2 pb-10",
						activeTab === "finanzas" ? "flex" : "hidden lg:flex",
					)}
				>
					<MotionDiv
						variants={entranceVariants}
						className="overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-1)] shadow-xl transition-[background-color,border-color,box-shadow] duration-200 hover:bg-[var(--surface-2)] hover:shadow-lg"
					>
						<CostStructure />
					</MotionDiv>
					<MotionDiv
						variants={entranceVariants}
						className="overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-1)] shadow-xl transition-[background-color,border-color,box-shadow] duration-200 hover:bg-[var(--surface-2)] hover:shadow-lg"
					>
						<SmartProcurement />
					</MotionDiv>
				</div>
			</MotionDiv>
		</div>
	);
};
