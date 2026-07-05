/**
 * @fileoverview Componente de tarjeta individual para cada agente
 * @module features/agent-swarm/components/AgentCard
 */

import { motion } from "framer-motion";
import { CheckCircle2, type LucideIcon } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "../types";
import { STATE_CONFIG } from "../types";

interface AgentCardProps {
	/** ID único del agente */
	id: string;
	/** Nombre visible del agente */
	label: string;
	/** Icono Lucide del agente */
	icon: LucideIcon;
	/** Estado actual del agente */
	status: AgentStatus;
	/** Si es el último agente en la lista (para conector) */
	isLast?: boolean;
	/** Si el sidebar está colapsado */
	isCollapsed?: boolean;
	/** Index para animación stagger */
	index?: number;
}

/**
 * Componente de tarjeta individual para un agente del enjambre
 *
 * @example
 * ```tsx
 * <AgentCard
 *   id="lector"
 *   label="Lector"
 *   icon={ScanLine}
 *   status="active"
 *   isLast={false}
 * />
 * ```
 */
export const AgentCard = memo(function AgentCard({
	id,
	label,
	icon: Icon,
	status,
	isLast = false,
	isCollapsed = false,
	index = 0,
}: AgentCardProps) {
	const config = STATE_CONFIG[status];
	const isActive = status === "active";
	const isCompleted = status === "completed";

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05, duration: 0.3 }}
			layout
			className={cn(
				"group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-2.5 transition-[background-color,border-color,box-shadow,transform] duration-300",
				!isCollapsed && "hover:bg-muted/40 hover:border-border",
				config.containerClass,
			)}
		>
			{/* Conector visual entre agentes */}
			{!isCollapsed && !isLast && (
				<div className="absolute left-[27px] top-[calc(100%-4px)] w-[2px] h-4 bg-border/70 -z-10">
					{isCompleted && (
						<motion.div
							initial={{ height: 0 }}
							animate={{ height: "100%" }}
							transition={{ duration: 0.5, ease: "circOut" }}
							className="w-full bg-[rgba(var(--premium-success-rgb),0.40)]"
						/>
					)}
				</div>
			)}

			{/* Icono del agente con estado visual */}
			<div
				className={cn(
					"relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-[background-color,border-color,color,box-shadow,transform] duration-300",
					config.iconClass,
				)}
			>
				{/* Efecto de onda cuando está activo */}
				{isActive && (
					<>
						<motion.div
							className="absolute inset-0 bg-primary/20"
							animate={{
								scale: [1, 1.2, 1],
								opacity: [0.5, 0, 0.5],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						/>
						<motion.div
							className="absolute inset-0 border-2 border-primary/30 rounded-xl"
							animate={{
								scale: [1, 1.3, 1],
								opacity: [1, 0, 1],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: "easeOut",
							}}
						/>
					</>
				)}

				<Icon
					size={20}
					className={cn(
						"relative z-10 transition-[color,transform,opacity] duration-300",
						isActive && "animate-pulse",
					)}
				/>

				{/* Indicador de estado completado */}
				{isCompleted && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--premium-success)] flex items-center justify-center"
					>
						<CheckCircle2 size={10} className="text-background" />
					</motion.div>
				)}
			</div>

			{/* Detalles del estado */}
			{!isCollapsed && (
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<span
							className={cn(
								"text-[12px] font-bold tracking-tight uppercase transition-colors duration-300",
								isActive
									? "text-foreground"
									: isCompleted
										? "text-[var(--premium-success)]"
										: "text-muted-foreground",
							)}
						>
							{label}
						</span>
						<span
							className={cn(
								"rounded-md border px-2 py-0.5 text-3xs font-bold uppercase tracking-wider transition-[background-color,border-color,color,box-shadow,transform] duration-200",
								config.badgeClass,
							)}
						>
							{config.badgeText}
						</span>
					</div>

					<div className="flex items-center gap-2">
						{/* Barra de progreso individual */}
						<div className="flex-1 h-[3px] bg-border/70 rounded-full overflow-hidden">
							<motion.div
								className={cn(
									"h-full rounded-full",
									isActive && "bg-gradient-to-r from-primary/60 to-primary",
									isCompleted && "bg-[var(--premium-success)]",
									!isActive && !isCompleted && "bg-muted-foreground/40",
								)}
								initial={{ width: "0%" }}
								animate={{
									width: isCompleted ? "100%" : isActive ? "60%" : "0%",
								}}
								transition={{ duration: 0.5, ease: "circOut" }}
							/>
						</div>

						{/* Latencia simulada */}
						<span
							className={cn(
								"text-3xs font-mono tabular-nums transition-colors",
								isActive ? "text-primary/70" : "text-muted-foreground",
							)}
						>
							{isActive ? "<1ms" : isCompleted ? "0.8ms" : "--"}
						</span>
					</div>
				</div>
			)}
		</motion.div>
	);
});

export default AgentCard;
