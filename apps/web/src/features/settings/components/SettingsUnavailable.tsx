import type { ReactNode } from "react";

interface SettingsUnavailableProps {
	title: string;
	children: ReactNode;
}

/**
 * Honest placeholder for a settings area that has no backend yet. It states
 * the limit instead of rendering controls that change nothing.
 */
export function SettingsUnavailable({
	title,
	children,
}: SettingsUnavailableProps) {
	return (
		<section
			aria-labelledby="settings-unavailable-title"
			className="rounded-xl border border-dashed border-border p-6"
		>
			<h2 id="settings-unavailable-title" className="text-base font-medium">
				{title}
			</h2>
			<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
				{children}
			</p>
		</section>
	);
}
