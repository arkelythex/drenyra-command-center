/**
 * MobileMenuButton Component
 * Single Responsibility: Mobile menu toggle button
 *
 * WCAG 2.5.5: Touch target mínimo 48×48px
 * WCAG 4.1.2: aria-expanded, aria-controls para estado del menú
 */

import { forwardRef } from "react";
import type { ReactElement } from "react";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface MobileMenuButtonProps {
	readonly isOpen: boolean;
	readonly onClick: () => void;
	readonly "aria-controls"?: string;
}

export const MobileMenuButton = forwardRef<
	HTMLButtonElement,
	MobileMenuButtonProps
>(function MobileMenuButton({ isOpen, onClick, ...props }, ref): ReactElement {
	return (
		<button
			ref={ref}
			type="button"
			className={cn(
				"inline-flex h-12 w-12 min-h-[3rem] min-w-[3rem] items-center justify-center rounded-xl touch-manipulation [-webkit-tap-highlight-color:transparent] lg:hidden",
				"transition-colors",
				"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
				isOpen
					? "bg-foreground/5 text-foreground"
					: "text-foreground hover:bg-foreground/15",
			)}
			onClick={onClick}
			aria-label={
				isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"
			}
			aria-expanded={isOpen}
			aria-controls="mobile-menu"
			{...props}
		>
			{isOpen ? (
				<X size={24} aria-hidden="true" />
			) : (
				<Menu size={24} aria-hidden="true" />
			)}
		</button>
	);
});
