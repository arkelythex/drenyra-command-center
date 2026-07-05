import {
	ArrowRight,
	CheckCircle2,
	FileText,
	RefreshCw,
	Search,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { cn } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { useTaxation } from "../../hooks/useTaxation";
import { TaxLiquidationHeader } from "./components/TaxLiquidationHeader";
import { TaxLiquidationSummary } from "./components/TaxLiquidationSummary";
import { TaxLiquidationTable } from "./components/TaxLiquidationTable";
import { isTaxTabId, type StepItemProps, type TaxTabId } from "./types";

/* ─── StepItem — checklist row ─── */
const StepItem = ({ label, done }: StepItemProps) => (
	<div
		className={cn(
			"flex items-center gap-4 rounded-xl border p-3 transition-[background-color,border-color,box-shadow,opacity,transform] duration-300",
			done
				? "bg-[rgba(var(--premium-success-rgb),0.05)] border-[rgba(var(--premium-success-rgb),0.20)]"
				: "bg-transparent border-transparent opacity-60 hover:opacity-100",
		)}
	>
		<div
			className={cn(
				"flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm transition-[background-color,border-color,color,box-shadow,transform]",
				done
					? "scale-105 border-[var(--premium-success)] bg-[var(--premium-success)] text-background"
					: "border-muted-foreground/30 bg-transparent",
			)}
		>
			{done && <CheckCircle2 size={12} strokeWidth={3} />}
		</div>
		<span
			className={cn(
				"text-2xs font-black uppercase tracking-widest leading-none",
				done ? "text-[var(--premium-success)]" : "text-muted-foreground",
			)}
		>
			{label}
		</span>
	</div>
);

/* ─── Main Component ─── */
export function TaxLiquidationView() {
	const { data, calculations } = useTaxation();
	const { setIsMobileOpen } = useSidebarLayout();
	const [activeTab, setActiveTab] = useState<TaxTabId>("liquidation");
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<div className="flex flex-col h-full bg-background overflow-hidden font-sans text-foreground relative">
			{/* 📱 MOBILE: Floating Navigation Dock */}
			<MobileTabNavigation
				tabs={[
					{ id: "liquidation", label: "Liquidación" },
					{ id: "closure", label: "Cierre" },
				]}
				activeTab={activeTab}
				onTabChange={(id) => {
					if (isTaxTabId(id)) {
						setActiveTab(id);
					}
				}}
				className="left-auto right-4 top-4"
			/>

			{/* 📱 MOBILE: Toolbar (Search + Actions) */}
			<div className="px-4 py-4 border-b border-[var(--border-default)] bg-[var(--bg-1)] flex flex-col sm:hidden gap-6 z-40 relative mt-14">
				<div className="flex gap-2 w-full items-center">
					<div className="relative group flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Buscar concepto o casilla"
							className="h-10 w-full rounded-xl border-border/50 bg-muted/30 pl-10 text-label font-bold uppercase tracking-wider transition-[background-color,border-color,box-shadow,color] placeholder:text-muted-foreground/50 focus:bg-background focus:outline-none focus-visible:border-primary"
						/>
					</div>

					{/* Mobile Actions: Inline with Search */}
					<div className="flex gap-2 items-center">
						<button className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-[background-color,box-shadow,transform] hover:scale-[1.03] hover:bg-foreground/90 active:scale-95">
							<RefreshCw size={16} strokeWidth={2} />
						</button>
					</div>
				</div>
			</div>

			{/* 🖥️ DESKTOP: Header */}
			<TaxLiquidationHeader
				period={data.period}
				onMenuClick={() => setIsMobileOpen(true)}
			/>

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-background">
				<MotionDiv
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="max-w-[1600px] mx-auto space-y-8 pb-20"
				>
					{/* Top Stats Summary */}
					<TaxLiquidationSummary
						igvPagar={calculations.igvPagar}
						rentaPagar={calculations.rentaPagar}
						totalImpuestos={calculations.totalImpuestos}
					/>

					{/* Two-column layout */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
						{/* Main: Table + Guided Review */}
						<div className="lg:col-span-8 space-y-8">
							<TaxLiquidationTable
								debito={calculations.igvDetails.debito}
								credito={calculations.igvDetails.credito}
								totalImpuestos={calculations.totalImpuestos}
							/>

							{/* Guided Review Card */}
							<MotionDiv
								variants={entranceVariants}
								className="rounded-3xl border border-border/50 bg-card p-8 shadow-sm"
							>
								<div className="space-y-6">
									<div className="flex items-center gap-2 text-label font-black uppercase tracking-[0.3em] text-foreground">
										<ShieldCheck size={14} /> Revisión asistida
									</div>
									<p className="text-lg font-medium leading-relaxed text-foreground max-w-2xl">
										Se detectó una oportunidad de compensación en la cuenta{" "}
										<span className="text-foreground font-bold border-b border-foreground/50">
											4011
										</span>{" "}
										que podría reducir la carga del periodo en un{" "}
										<span className="font-black">2.5%</span>, sujeta a
										validación contable.
									</p>
								</div>
							</MotionDiv>
						</div>

						{/* Sidebar: Checklist */}
						<div className="lg:col-span-4 space-y-8">
							<MotionDiv
								variants={entranceVariants}
								className="rounded-3xl border border-border/50 bg-card p-8 shadow-xl sticky top-24"
							>
								<h3 className="text-label font-black uppercase tracking-[0.3em] text-muted-foreground mb-8 flex items-center gap-2">
									<FileText size={14} /> Checklist de cierre
								</h3>
								<div className="space-y-5">
									<StepItem label="SIRE Sincronizado" done />
									<StepItem label="CDR Validados" done />
									<StepItem label="Libros Electrónicos" done={false} />
								</div>

								<Button className="group relative mt-10 h-14 w-full overflow-hidden rounded-xl bg-foreground text-label font-black uppercase tracking-[0.2em] text-background shadow-xl shadow-black/8 transition-[background-color,box-shadow,transform] hover:bg-foreground/90 hover:shadow-xl">
									<span className="relative z-10 flex items-center gap-2 transition-[gap,transform] group-hover:gap-2.5">
										Revisar cierre <ArrowRight size={14} />
									</span>
								</Button>
							</MotionDiv>
						</div>
					</div>
				</MotionDiv>
			</div>
		</div>
	);
}
