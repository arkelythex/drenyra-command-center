import type React from "react";
/**
 * @fileoverview Componente QuickAction para respuestas del agente
 * @module features/cognitive-hub/components/QuickActionCard
 *
 * Muestra tarjetas de acción rápida que permiten al usuario
 * navegar directamente a secciones o ejecutar acciones.
 */

import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, type LucideIcon } from "lucide-react";
import type { AppRoutePath } from "@/lib/router/app-route";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
	/** Título de la acción */
	title: string;
	/** Descripción breve */
	description: string;
	/** Ruta de navegación */
	target: AppRoutePath;
	/** Parámetros de URL opcionales */
	params?: Record<string, string>;
	/** Icono opcional */
	icon?: LucideIcon;
	/** Variante visual */
	variant?: "primary" | "secondary" | "ghost";
	/** Clases adicionales */
	className?: string;
}

/**
 * Tarjeta de acción rápida para respuestas del agente
 *
 * @example
 * ```tsx
 * <QuickActionCard
 *   title="Ver Cuentas por Cobrar"
 *   description="3 facturas pendientes por S/ 12,450"
 *   target="/invoices"
 *   params={{ filter: 'pending' }}
 *   variant="primary"
 * />
 * ```
 */
export function QuickActionCard({
	title,
	description,
	target,
	params,
	icon: Icon,
	variant = "primary",
	className,
}: QuickActionCardProps) {
	const navigate = useNavigate();

	const handleClick = () => {
		navigate({ to: target, search: params });
	};

	const variantStyles = {
		primary:
			"bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50",
		secondary: "border-border bg-card hover:border-border/80 hover:bg-muted/70",
		ghost: "bg-transparent border-transparent hover:bg-muted/70",
	};

	return (
		<motion.button
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ scale: 1.01, x: 2 }}
			whileTap={{ scale: 0.99 }}
			onClick={handleClick}
			className={cn(
				"group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200",
				variantStyles[variant],
				className,
			)}
		>
			{/* Icono */}
			{Icon && (
				<div
					className={cn(
						"h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
						variant === "primary"
							? "bg-primary/20 text-primary"
							: "bg-muted/70 text-muted-foreground",
					)}
				>
					<Icon size={20} />
				</div>
			)}

			{/* Contenido */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<h4
						className={cn(
							"font-bold text-sm",
							variant === "primary" ? "text-primary" : "text-foreground",
						)}
					>
						{title}
					</h4>
					<ExternalLink
						size={12}
						className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
				<p className="mt-0.5 truncate text-xs text-muted-foreground">
					{description}
				</p>
			</div>

			{/* Flecha */}
			<ArrowRight
				size={16}
				className={cn(
					"shrink-0 transition-[color,transform,opacity] duration-200",
					variant === "primary" ? "text-primary" : "text-muted-foreground",
					"group-hover:translate-x-1",
				)}
			/>
		</motion.button>
	);
}

/**
 * Grid de acciones rápidas
 */
interface QuickActionGridProps {
	children: React.ReactNode;
	className?: string;
}

export function QuickActionGrid({ children, className }: QuickActionGridProps) {
	return <div className={cn("grid gap-3", className)}>{children}</div>;
}

export default QuickActionCard;
