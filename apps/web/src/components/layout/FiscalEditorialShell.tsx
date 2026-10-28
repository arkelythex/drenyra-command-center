import type { ReactNode } from "react";

interface FiscalEditorialShellProps {
	children: ReactNode;
	mode?: "desktop" | "review" | "evidence";
}

/**
 * FiscalEditorialShell — root shell wrapper for Drenyra's fiscal workspace.
 * Provides the background, theme-aware shell gradient, and global chrome.
 * Referenced by AgenticLayout as the outermost container.
 */
export function FiscalEditorialShell({
	children,
	mode = "desktop",
}: FiscalEditorialShellProps) {
	return (
		<div
			className="flex h-screen w-full flex-col overflow-hidden"
			data-shell-mode={mode}
		>
			{children}
		</div>
	);
}
