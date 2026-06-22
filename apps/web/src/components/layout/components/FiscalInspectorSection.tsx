import type { SectionProps } from "../FiscalInspector.types";

/**
 * Reusable section wrapper used throughout the inspector panels.
 */
export function FiscalInspectorSection({ title, children }: SectionProps) {
	return (
		<div className="space-y-2">
			<h3 className="text-3xs font-bold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
				{title}
			</h3>
			{children}
		</div>
	);
}
