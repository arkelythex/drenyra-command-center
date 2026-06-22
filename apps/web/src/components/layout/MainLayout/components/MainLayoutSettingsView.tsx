import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

interface MainLayoutSettingsViewProps {
	children: ReactNode;
}

/**
 * Simplified layout for settings pages — no sidebar, no navigation chrome.
 */
export function MainLayoutSettingsView({
	children,
}: MainLayoutSettingsViewProps) {
	return (
		<div className="flex w-full h-[100dvh] bg-[var(--surface-1)] overflow-hidden font-sans relative selection:bg-primary/20">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--surface-1)] focus:text-[var(--text-primary)] focus:rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:outline-none"
			>
				Saltar al contenido principal
			</a>
			<main
				id="main-content"
				className="flex-1 flex flex-col relative overflow-hidden"
			>
				<ErrorBoundary>{children}</ErrorBoundary>
			</main>
		</div>
	);
}
