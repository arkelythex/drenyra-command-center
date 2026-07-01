import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowRightLeft,
	CheckCircle2,
	Database,
	Globe,
	PenTool,
	RotateCcw,
	ShieldAlert,
	XCircle,
	Zap,
} from "lucide-react";
import React from "react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { DigitalSignaturePad } from "./DigitalSignaturePad";

interface InterventionPanelProps {
	onClose: () => void;
	autonomyLevel: number;
}

export const InterventionPanel = ({
	onClose,
	autonomyLevel,
}: InterventionPanelProps) => {
	const isSignatureRequired = autonomyLevel === 1;
	const [showSignaturePad, setShowSignaturePad] = React.useState(false);

	const handleAction = () => {
		if (isSignatureRequired) {
			setShowSignaturePad(true);
		} else {
			onClose();
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98, y: 20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.98, y: 20 }}
			className={cn(
				tokensToClasses.borderRadius("modal"),
				"absolute inset-x-6 top-6 bottom-32 z-50 flex flex-col overflow-hidden border border-border bg-card/95 shadow-xl ",
			)}
		>
			<AnimatePresence>
				{showSignaturePad && (
					<DigitalSignaturePad
						onConfirm={onClose}
						onCancel={() => setShowSignaturePad(false)}
					/>
				)}
			</AnimatePresence>

			{/* HEADER */}
			<header className="p-8 border-b border-border flex items-center justify-between bg-card/70">
				<div className="flex items-center gap-5">
					<div
						className={cn(
							"h-14 w-14 rounded-2xl border flex items-center justify-center shadow-glow",
							isSignatureRequired
								? "bg-amber-500/20 border-amber-500/30 text-amber-500"
								: "bg-red-500/20 border-red-500/30 text-red-500",
						)}
					>
						{isSignatureRequired ? (
							<PenTool size={28} strokeWidth={2.5} />
						) : (
							<ShieldAlert size={28} strokeWidth={2.5} />
						)}
					</div>
					<div>
						<h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
							{isSignatureRequired
								? "Validación con firma manual"
								: "Revisión de discrepancia"}
						</h2>
						<div className="flex items-center gap-3 mt-1.5">
							<span className="text-label font-mono font-black text-muted-foreground uppercase tracking-widest">
								Ticket #ARK-20608-IGV
							</span>
							<span className="h-1.5 w-1.5 rounded-full bg-border" />
							<div className="flex items-center gap-1.5">
								<span
									className={cn(
										"h-2 w-2 rounded-full animate-pulse",
										isSignatureRequired ? "bg-amber-500" : "bg-red-500",
									)}
								/>
								<span
									className={cn(
										"text-label font-mono font-black uppercase tracking-widest",
										isSignatureRequired ? "text-amber-500" : "text-red-500",
									)}
								>
									{isSignatureRequired
										? "Estado: Bloqueado por Política"
										: "Prioridad: Crítica"}
								</span>
							</div>
						</div>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground transition-[background-color,color,transform] duration-200 hover:bg-muted/70 hover:text-foreground active:scale-90"
				>
					<XCircle size={24} />
				</button>
			</header>

			{/* CONTENT: THE NEURAL DIFF (Ultra-clean Architecture) */}
			<div className="flex-1 p-10 overflow-y-auto space-y-10 no-scrollbar">
				{isSignatureRequired && (
					<div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-4">
						<div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
							<ShieldAlert size={20} />
						</div>
						<p className="text-sm text-muted-foreground font-medium">
							<span className="font-black uppercase text-amber-500 mr-2">
								Acción Bloqueada:
							</span>
							Debido al nivel de autonomía{" "}
							<span className="text-foreground font-bold">
								LVL 01 (ASISTENTE)
							</span>
							, se requiere una firma digital manual del responsable fiscal para
							proceder con el ajuste de crédito.
						</p>
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-center">
					{/* SOURCE A: LOCAL LEDGER */}
					<div className="lg:col-span-5 space-y-5">
						<div className="flex items-center gap-3 px-1">
							<div className="h-6 w-6 rounded-lg bg-[rgba(var(--premium-info-rgb),0.10)] flex items-center justify-center border border-[rgba(var(--premium-info-rgb),0.20)]">
								<Database
									size={14}
									className="text-[var(--premium-action-cyan)]"
								/>
							</div>
							<span className="text-label font-black text-muted-foreground uppercase tracking-[0.2em]">
								Ledger Interno (ERP)
							</span>
						</div>
						<div
							className={cn(
								tokensToClasses.borderRadius("card"),
								"group relative space-y-8 border border-border bg-card/70 p-8 transition-[background-color,border-color,box-shadow] duration-200 hover:bg-card/75",
							)}
						>
							<div className="space-y-2">
								<span className="text-2xs text-muted-foreground uppercase font-black tracking-widest">
									Monto Imponible
								</span>
								<p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">
									S/ 150,000.00
								</p>
							</div>
							<div className="space-y-2">
								<span className="text-2xs text-muted-foreground uppercase font-black tracking-widest">
									IGV (18%)
								</span>
								<div className="flex items-baseline gap-3">
									<p className="text-3xl font-black text-[var(--premium-action-cyan)] tabular-nums tracking-tighter">
										S/ 27,000.00
									</p>
									<span className="text-2xs font-black text-[var(--premium-action-cyan)] uppercase">
										VÁLIDO LOCAL
									</span>
								</div>
							</div>
							<div className="pt-6 border-t border-border/80 flex items-center justify-between opacity-50">
								<span className="text-2xs font-mono text-muted-foreground uppercase tracking-tighter font-bold">
									REF: AS-442-A1
								</span>
								<span className="text-2xs font-mono text-muted-foreground font-bold">
									FEB-14-2026
								</span>
							</div>
						</div>
					</div>

					{/* BRIDGE / CONFLICT (Focus Point) */}
					<div className="lg:col-span-1 flex flex-col items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 shadow-glow">
							<ArrowRightLeft
								size={28}
								strokeWidth={2.5}
								className="animate-pulse"
							/>
						</div>
						<div className="text-center">
							<span className="block text-2xs font-black text-red-500 uppercase tracking-widest mb-1">
								Varianza
							</span>
							<span className="text-xl font-black text-foreground tracking-tighter">
								S/ 1,400
							</span>
						</div>
					</div>

					{/* SOURCE B: SUNAT CLOUD */}
					<div className="lg:col-span-5 space-y-5">
						<div className="flex items-center gap-3 px-1">
							<div className="h-6 w-6 rounded-lg bg-[rgba(var(--premium-success-rgb),0.10)] flex items-center justify-center border border-[rgba(var(--premium-success-rgb),0.20)]">
								<Globe size={14} className="text-[var(--premium-success)]" />
							</div>
							<span className="text-label font-black text-muted-foreground uppercase tracking-[0.2em]">
								SUNAT Virtual (SIRE)
							</span>
						</div>
						<div
							className={cn(
								tokensToClasses.borderRadius("card"),
								"group relative space-y-8 overflow-hidden border border-red-500/40 bg-card/75 p-8 transition-[background-color,border-color,box-shadow] duration-200",
							)}
						>
							<div className="absolute inset-0 bg-red-500/[0.03] pointer-events-none group-hover:bg-red-500/[0.05] transition-colors" />
							<div className="space-y-2 relative z-10">
								<span className="text-2xs text-muted-foreground uppercase font-black tracking-widest">
									Monto Imponible
								</span>
								<p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">
									S/ 157,777.77
								</p>
							</div>
							<div className="space-y-2 relative z-10">
								<span className="text-2xs text-muted-foreground uppercase font-black tracking-widest">
									IGV (18%)
								</span>
								<div className="flex items-baseline gap-3">
									<p className="text-3xl font-black text-red-500 tabular-nums tracking-tighter">
										S/ 28,400.00
									</p>
									<span className="text-2xs font-black text-red-500 animate-pulse">
										DISCREPANCIA
									</span>
								</div>
							</div>
							<div className="pt-6 border-t border-border/80 flex items-center justify-between opacity-100 relative z-10">
								<span className="text-2xs font-mono text-muted-foreground uppercase tracking-tighter font-bold">
									RUC: 206087...
								</span>
								<div className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30">
									<span className="text-3xs font-black text-red-500 uppercase">
										EXTERNAL MASTER
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* NEURAL ANALYSIS (AI RECOMMENDER) */}
				<div
					className={cn(
						tokensToClasses.borderRadius("modal"),
						"group relative flex items-start gap-8 overflow-hidden border border-[rgba(var(--premium-success-rgb),0.20)] bg-[rgba(var(--premium-success-rgb),0.03)] p-8",
					)}
				>
					<div className="absolute inset-0 bg-gradient-to-r from-[var(--premium-success)]/[0.02] to-transparent pointer-events-none" />
					<div className="h-14 w-14 rounded-2xl bg-[rgba(var(--premium-success-rgb),0.20)] border border-[rgba(var(--premium-success-rgb),0.30)] flex items-center justify-center text-[var(--premium-success)] shrink-0 shadow-glow relative z-10">
						<Zap size={28} fill="currentColor" strokeWidth={0} />
					</div>
					<div className="relative z-10">
						<p className="text-label font-black text-[var(--premium-success)] uppercase tracking-[0.2em] mb-2 font-mono">
							Análisis del agente auditor
						</p>
						<p className="text-base text-foreground font-medium leading-relaxed max-w-4xl">
							Se ha verificado la validez del comprobante{" "}
							<span className="text-foreground font-black underline decoration-[var(--color-success)]/50">
								E001-4492
							</span>{" "}
							en el repositorio nacional. La discrepancia se origina por una
							omisión en el registro de compras local.
							<br />
							<br />
							Recomendación:{" "}
							<span className="text-[var(--premium-success)] font-bold italic">
								Sincronización extemporánea mediante ajuste de crédito fiscal
								M7.
							</span>
						</p>
					</div>
				</div>
			</div>

			{/* FOOTER ACTIONS (High Affordance) */}
			<footer className="flex items-center justify-between border-t border-border bg-card/70 p-10 ">
				<button
					type="button"
					onClick={onClose}
					className="flex items-center gap-3 rounded-2xl border border-border px-8 py-4 text-label font-black uppercase tracking-widest text-muted-foreground transition-[background-color,color,transform] duration-200 hover:bg-muted/70 hover:text-foreground active:scale-95"
				>
					<RotateCcw size={16} /> Posponer Auditoría
				</button>

				<div className="flex items-center gap-6">
					<button
						type="button"
						className="rounded-2xl border border-border px-8 py-4 text-label font-black uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,transform] duration-200 hover:border-border hover:bg-muted/70 hover:text-foreground active:scale-95"
					>
						Edición Manual
					</button>
					<button
						type="button"
						onClick={handleAction}
						className={cn(
							"group flex items-center gap-4 rounded-2xl px-12 py-5 text-[13px] font-black uppercase tracking-widest shadow-lg transition-[background-color,box-shadow,transform,opacity] duration-200 hover:scale-[1.01] active:scale-95",
							isSignatureRequired
								? "bg-amber-500 text-amber-950 shadow-amber-500/15"
								: "bg-primary text-primary-foreground shadow-primary/20",
						)}
					>
						{isSignatureRequired ? (
							<PenTool size={20} strokeWidth={3} />
						) : (
							<CheckCircle2
								size={20}
								strokeWidth={3}
								className="transition-transform duration-200 group-hover:scale-105"
							/>
						)}
						{isSignatureRequired
							? "Firmar y aplicar ajuste"
							: "Aplicar ajuste sugerido"}
					</button>
				</div>
			</footer>
		</motion.div>
	);
};
