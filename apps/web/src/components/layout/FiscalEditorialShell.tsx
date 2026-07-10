import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FiscalEditorialShellMode = "operational" | "command-center";

export interface FiscalEditorialShellProps {
	mode?: FiscalEditorialShellMode;
	children: ReactNode;
	className?: string;
}

/**
 * Unified editorial chrome for Drenyra web shells.
 * Used by AgenticLayout (command-center) and was previously used by MainLayout (operational).
 */
export function FiscalEditorialShell({
	mode = "operational",
	children,
	className,
}: FiscalEditorialShellProps) {
	return (
		<div
			data-shell-mode={mode}
			data-design-system="fiscal-editorial-v3"
			className={cn(
				"fiscal-editorial-shell flex min-h-0 w-full flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased",
				mode === "command-center" && "h-full",
				mode === "operational" && "h-[100dvh] overflow-hidden",
				className,
			)}
		>
			{children}
		</div>
	);
}
