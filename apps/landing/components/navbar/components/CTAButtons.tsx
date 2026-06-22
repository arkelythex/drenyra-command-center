/**
 * CTAButtons Component
 * Elite Call-to-action buttons with dynamic behavior
 */

"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { V2_LANDING_COPY } from "@/lib/constants/copy";
import type { CTAButtonsProps } from "../types";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useAnalytics } from "@/lib/use-analytics";

export function CTAButtons({
	className,
	onClick,
	compact = false,
}: CTAButtonsProps): ReactElement | null {
	const { trackCtaClick } = useAnalytics();
	const prefersReducedMotion = useReducedMotion();
	const pathname = usePathname();
	const isHome = pathname === "/";
	const { ctaPrimary, ctaPrimaryHref } = V2_LANDING_COPY.navbar;
	const primaryHref = isHome ? ctaPrimaryHref : "/demo";
	const primaryLabel = isHome ? ctaPrimary : "Solicitar demo";
	const primaryEvent = isHome ? "explorar_drenyra" : "solicitar_demo";
	const stackOnMobile = className?.includes("flex-col") ?? false;

	if (isHome && stackOnMobile) {
		return null;
	}

	return (
		<div
			className={cn(
				"flex items-center gap-3",
				stackOnMobile && "items-stretch gap-2 sm:gap-3",
				className,
			)}
		>
			<AnimatePresence mode="wait">
				{!isHome && !compact && !stackOnMobile && (
					<motion.div
						initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : 10 }}
						transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
					>
						<Link
							href="/drenyra"
							onClick={(e) => {
								trackCtaClick("acceso", "navbar");
								onClick?.(e);
							}}
							className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						>
							<LogIn className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
							<span>Acceso</span>
						</Link>
					</motion.div>
				)}
			</AnimatePresence>

			<Link
				href={primaryHref}
				className={cn(
					"group inline-flex min-h-11 items-center justify-center gap-2 font-medium touch-manipulation transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					isHome
						? "rounded-lg border border-foreground/20 px-5 text-sm text-foreground hover:border-foreground/35 hover:bg-foreground/5"
						: cn(
								"btn-primary font-bold hover:shadow-2xl hover:shadow-primary/20",
								!prefersReducedMotion && "hover:-translate-y-0.5",
							),
					stackOnMobile
						? "w-full px-5 py-3 text-sm"
						: compact
							? isHome
								? "px-4 py-2 text-xs"
								: "scale-90 px-5 py-2 text-xs"
							: isHome
								? "px-5 py-2 text-sm"
								: "px-6 py-2.5 text-sm",
				)}
				onClick={(e) => {
					trackCtaClick(primaryEvent, "navbar");
					onClick?.(e);
				}}
			>
				<span>{primaryLabel}</span>
				<ArrowRight
					className={cn(
						"h-4 w-4 transition-transform duration-200",
						!prefersReducedMotion && "group-hover:translate-x-1",
					)}
					aria-hidden="true"
				/>
			</Link>

			{!isHome && stackOnMobile ? (
				<Link
					href="/drenyra"
					onClick={(e) => {
						trackCtaClick("acceso", "navbar_mobile");
						onClick?.(e);
					}}
					className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#D4D0C4] touch-manipulation transition-colors hover:border-white/20 hover:text-[#F0ECE4]"
				>
					<LogIn className="mr-2 h-4 w-4 text-[#A8A498] transition-colors" aria-hidden="true" />
					<span>Acceso</span>
				</Link>
			) : null}
		</div>
	);
}
