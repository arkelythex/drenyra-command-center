"use client";

import type { ReactElement, ReactNode } from "react";

import { DrenyraMark } from "@/components/drenyra/drenyra-mark";
import { LANDING_CAPTION_CLASS } from "@/lib/landing/ui-classes";
import { cn } from "@/lib/utils";

type DrenyraMacosChromeProps = {
	readonly title: string;
	readonly children: ReactNode;
	readonly className?: string;
	readonly badge?: string;
	readonly modelBadge?: string;
	readonly showLogo?: boolean;
	readonly size?: "hero" | "default" | "mini";
};

/**
 * Premium macOS-style window shell — glass border, traffic lights, Drenyra logo.
 * Shared across hero, workspace, terminal, and feature mini-windows.
 */
export function DrenyraMacosChrome({
	title,
	children,
	className,
	badge,
	modelBadge,
	showLogo = true,
	size = "default",
}: DrenyraMacosChromeProps): ReactElement {
	return (
		<div
			className={cn(
				"drenyra-macos-window relative flex w-full flex-col overflow-hidden",
				size === "hero" && "drenyra-macos-window--hero",
				size === "mini" && "drenyra-macos-window--mini",
				className,
			)}
		>
			<header className="flex shrink-0 items-center gap-2 border-b border-[var(--drenyra-border-glass)] bg-[var(--drenyra-glass)] px-3 py-2.5 backdrop-blur-md md:px-4 md:py-3">
				<div className="flex gap-1.5" aria-hidden>
					<span className="drenyra-traffic-light drenyra-traffic-light--close" />
					<span className="drenyra-traffic-light drenyra-traffic-light--min" />
					<span className="drenyra-traffic-light drenyra-traffic-light--max" />
				</div>
				{showLogo ? (
					<DrenyraMark className="ml-1 shrink-0 text-[var(--drenyra-lucuma)]" size={18} />
				) : null}
				<span
					className={cn(
						"truncate font-mono uppercase tracking-widest text-foreground",
						size === "mini" ? "text-[10px]" : LANDING_CAPTION_CLASS,
					)}
				>
					{title}
				</span>
				<div className="ml-auto flex shrink-0 items-center gap-2">
					{modelBadge ? (
						<span className="drenyra-model-badge hidden font-mono text-2xs uppercase tracking-wider sm:inline">
							{modelBadge}
						</span>
					) : null}
					{badge ? (
						<span className="rounded-full border border-[var(--drenyra-border-glass)] bg-[var(--drenyra-accent-muted)] px-2 py-0.5 text-2xs font-medium uppercase tracking-wider drenyra-text-accent">
							{badge}
						</span>
					) : null}
				</div>
			</header>
			<div className="min-h-0 flex-1">{children}</div>
		</div>
	);
}
