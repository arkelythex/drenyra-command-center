import { motion } from "framer-motion";
import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import type React from "react";
import { Text } from "@/components/atoms/text";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/motion-primitives";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { cn } from "@/lib/utils";
import { useDashboardHealth } from "../hooks/useDashboardHealth";

export const FiscalHealthWidget: React.FC = () => {
	const { health } = useDashboardHealth();
	const normalizedScore = Number(health?.complianceScore ?? 0);
	const displayScore = Number.isFinite(normalizedScore)
		? Math.max(0, Math.min(100, Math.round(normalizedScore)))
		: 0;
	const progress = Math.min(Math.max(displayScore / 100, 0), 1);
	const circumference = 2 * Math.PI * 44;
	const isOptimal = displayScore >= 80;

	return (
		<SurfacePanel
			variant="elevated"
			padding="lg"
			className="group relative flex h-full flex-col items-center justify-center overflow-hidden"
		>
			<div className="relative flex h-56 w-56 items-center justify-center">
				{/* Internal Glow (Liquid Aura) */}
				<motion.div
					animate={{
						scale: [1, 1.05, 1],
						opacity: [0.15, 0.25, 0.15],
					}}
					transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
					className={cn(
						"pointer-events-none absolute inset-6 rounded-full blur-3xl",
						isOptimal ? "bg-success-muted" : "bg-danger-muted",
					)}
				/>

				<svg
					className="h-full w-full -rotate-90 transform"
					viewBox="0 0 100 100"
					aria-hidden="true"
				>
					<defs>
						<linearGradient
							id="fiscal-score-gradient"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%"
						>
							<stop
								offset="0%"
								stopColor={
									isOptimal
										? "rgb(var(--premium-success-rgb))"
										: "rgb(var(--premium-danger-rgb))"
								}
							/>
							<stop
								offset="100%"
								stopColor={
									isOptimal
										? "rgba(var(--premium-success-rgb),0.68)"
										: "rgba(var(--premium-danger-rgb),0.68)"
								}
							/>
						</linearGradient>
						<filter id="glow-filter">
							<feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					{/* Background Track */}
					<circle
						cx="50"
						cy="50"
						r="44"
						fill="transparent"
						stroke="rgba(148,163,184,0.16)"
						strokeWidth="5"
					/>

					{/* Path */}
					<motion.circle
						cx="50"
						cy="50"
						r="44"
						fill="transparent"
						stroke="url(#fiscal-score-gradient)"
						strokeWidth="7"
						strokeDasharray={circumference}
						initial={{ strokeDashoffset: circumference }}
						animate={{
							strokeDashoffset: circumference - circumference * progress,
						}}
						transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
						strokeLinecap="round"
						filter="url(#glow-filter)"
						className="drop-shadow-[0_0_10px_rgba(var(--premium-info-rgb),0.22)]"
					/>
				</svg>

				{/* Central Glass Disc */}
				<div className="absolute inset-[3.3rem] rounded-full border border-border/30 bg-card/80 shadow-[inset_0_2px_12px_rgba(255,255,255,0.05),inset_0_-8px_18px_rgba(0,0,0,0.35)] backdrop-blur-md" />

				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<div className="flex items-baseline gap-1">
						<Text
							variant="hero"
							className="text-6xl font-black tracking-tighter text-foreground"
						>
							<AnimatedNumber value={displayScore} />
						</Text>
						<Text
							variant="label"
							className="text-base font-black text-muted-foreground"
						>
							%
						</Text>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className={cn(
							"mt-3 rounded-full border px-5 py-1.5 backdrop-blur-sm",
							isOptimal
								? "border-success-subtle bg-success-subtle"
								: "border-danger-subtle bg-danger-subtle",
						)}
					>
						<Text
							variant="label"
							className={cn(
								"tracking-[0.2em] font-black uppercase text-3xs",
								isOptimal ? "text-success" : "text-danger",
							)}
						>
							Health Metrics
						</Text>
					</motion.div>
				</div>
			</div>

			{/* Footer info */}
			<div className="flex w-full items-center justify-between border-t border-border/30 px-2 pt-6">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2.5">
						<div
							className={cn(
								"h-2 w-2 rounded-full",
								isOptimal
									? "bg-success shadow-[0_0_12px_rgba(var(--premium-success-rgb),0.45)]"
									: "bg-danger shadow-[0_0_12px_rgba(var(--premium-danger-rgb),0.45)]",
								"animate-pulse",
							)}
						/>
						<Text
							variant="label"
							className="text-3xs font-black uppercase tracking-widest text-muted-foreground"
						>
							SUNAT Status
						</Text>
					</div>
					<div className="flex items-center gap-2">
						{isOptimal ? (
							<ShieldCheck size={18} className="text-success" />
						) : (
							<ShieldAlert size={18} className="text-danger" />
						)}
						<Text
							variant="body"
							className="text-sm font-black uppercase leading-none tracking-tight text-foreground"
						>
							{isOptimal ? "Optimal Compliance" : "Critical Warning"}
						</Text>
					</div>
				</div>

				<Button
					variant="glass"
					size="icon"
					aria-label="Agregar"
					className="group/btn h-12 w-12 rounded-xl border-border/40 bg-card/45 shadow-sm transition-[background-color,border-color,transform] duration-200 hover:bg-card/70 active:scale-95"
				>
					<Plus
						size={20}
						className="text-foreground transition-transform duration-200 group-hover/btn:rotate-90"
					/>
				</Button>
			</div>
		</SurfacePanel>
	);
};
