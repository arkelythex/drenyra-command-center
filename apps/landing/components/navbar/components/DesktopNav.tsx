/**
 * DesktopNav Component
 * Elite Navigation with Animated Active State Pill
 */

"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

import type { DesktopNavProps } from "../types";

function isHashAnchorHref(href: string): boolean {
	return href.startsWith("#");
}

export function DesktopNav({
	navItems,
	isNavItemActive,
	onItemClick,
}: DesktopNavProps): ReactElement {
	const [hoveredItem, setHoveredItem] = useState<string | null>(null);
	const prefersReducedMotion = useReducedMotion();

	return (
		<div
			className="hidden lg:flex items-center gap-2 p-1.5 rounded-full bg-foreground/[0.02] border border-foreground/5"
			onMouseLeave={() => setHoveredItem(null)}
		>
			{navItems.map((item) => {
				const isActive = isNavItemActive(item);
				const isHovered = hoveredItem === item.name;
				const useHashButton = isHashAnchorHref(item.href);

				const className = `relative inline-flex min-h-6 items-center px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
					isActive || isHovered ? "text-foreground" : "text-muted-foreground"
				}`;

				const pillClassName = `absolute inset-0 rounded-full z-0 ${
					isActive
						? "bg-foreground/10 border border-foreground/10 shadow-lg"
						: "bg-foreground/5"
				}`;

				const inner = (
					<>
						{(isActive || isHovered) &&
							(prefersReducedMotion ? (
								<div className={pillClassName} aria-hidden="true" />
							) : (
								<motion.div
									layoutId="navbar-pill"
									className={pillClassName}
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								/>
							))}
						<span className="relative z-10">{item.name}</span>
					</>
				);

				if (useHashButton) {
					return (
						<button
							key={item.name}
							type="button"
							onClick={() => onItemClick(item.href)}
							onMouseEnter={() => setHoveredItem(item.name)}
							className={className}
						>
							{inner}
						</button>
					);
				}

				return (
					<Link
						key={item.name}
						href={item.href}
						className={className}
						onClick={() => onItemClick(item.href)}
						onMouseEnter={() => setHoveredItem(item.name)}
					>
						{inner}
					</Link>
				);
			})}
		</div>
	);
}
