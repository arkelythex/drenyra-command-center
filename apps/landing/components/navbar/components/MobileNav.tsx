/**
 * MobileNav Component
 * Single Responsibility: Render mobile navigation con accesibilidad WCAG 2.1 AA
 *
 * Mejoras aplicadas:
 * - <ul>/<li> en lugar de role="menu" / role="menuitem" (menús ARIA son para apps, no navegación)
 * - pointer-events-none + inert cuando cerrado para evitar clicks fantasma
 * - Colores warm reemplazados (no más bg-black/95 ni hover:bg-white/5)
 * - Backdrop overlay cuando está abierto
 * - aria-hidden para ocultar de lectores de pantalla cuando cerrado
 */

import { forwardRef, useRef } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReducedMotion, useFocusTrap } from "@/lib/hooks";

import { cn } from "@/lib/utils";

import type { MobileNavProps } from "../types";
import { CTAButtons } from "./CTAButtons";

function isHashAnchorHref(href: string): boolean {
	return href.startsWith("#") || href.startsWith("/#");
}

export const MobileNav = forwardRef<
	HTMLDivElement,
	MobileNavProps & { readonly id?: string }
>(function MobileNav(
	{ isOpen, onClose, navItems, isNavItemActive, onItemClick, id },
	ref,
): ReactElement {
	const prefersReducedMotion = useReducedMotion();
	const pathname = usePathname();
	const isHome = pathname === "/";

	const trapRef = useRef<HTMLDivElement>(null);
	useFocusTrap(isOpen, trapRef);

	return (
		<div
			ref={(node) => {
				// Merge forwarded ref + trap ref
				if (typeof ref === "function") ref(node);
				else if (ref) ref.current = node;
				trapRef.current = node;
			}}
			id={id}
			role="dialog"
			aria-modal={isOpen}
			aria-label="Menú de navegación"
			className={cn(
				"lg:hidden overflow-hidden border-t transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
				prefersReducedMotion
					? isOpen
						? "opacity-100 border-white/10 bg-black/60 backdrop-blur-2xl"
						: "max-h-0 opacity-0 pointer-events-none border-transparent"
					: isOpen
						? "opacity-100 translate-y-0 border-white/10 bg-black/60 backdrop-blur-2xl"
						: "max-h-0 opacity-0 -translate-y-4 pointer-events-none border-transparent",
			)}
			aria-hidden={!isOpen}
			inert={isOpen ? undefined : true}
		>
			<ul className="container mx-auto flex flex-col gap-1.5 px-4 py-6 overflow-y-auto overscroll-contain list-none">
				{navItems.map((item) => {
					const isActive = isNavItemActive(item);
					const commonClasses = cn(
						"w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-all duration-300",
						isActive
							? "border border-white/15 bg-white/5 text-[#F0ECE4] shadow-lg shadow-black/30"
							: "text-[#D4D0C4] hover:bg-white/5 hover:text-[#E8E4D8] active:bg-white/10",
					);

					const inner = (
						<>
							<span>{item.name}</span>
							{isActive && (
								<span
									className="flex h-1.5 w-1.5 rounded-full bg-primary shadow-lg shadow-primary/40"
									aria-hidden="true"
								/>
							)}
						</>
					);

					return (
						<li key={item.name} className="list-none">
							{isHashAnchorHref(item.href) ? (
								<button
									type="button"
									className={commonClasses}
									onClick={() => onItemClick(item.href)}
									aria-current={isActive ? true : undefined}
								>
									{inner}
								</button>
							) : (
								<Link
									href={item.href}
									className={commonClasses}
									onClick={onClose}
									aria-current={isActive ? "page" : undefined}
								>
									{inner}
								</Link>
							)}
						</li>
					);
				})}

				{!isHome ? (
					<li className="mt-4 list-none border-t border-white/10 pt-6">
						<p className="mb-4 px-1 text-[#A8A498] text-xs font-bold uppercase tracking-[0.2em]">
							Arkelythex Enterprise
						</p>
						<CTAButtons className="flex-col w-full gap-3" onClick={onClose} />
					</li>
				) : null}
			</ul>
		</div>
	);
});
