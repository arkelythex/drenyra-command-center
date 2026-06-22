"use client";

import type { ReactElement } from "react";

interface SectionDividerProps {
	/** Gradient direction: top-to-bottom fades from bg to transparent */
	variant?: "fade-down" | "fade-up" | "line";
	className?: string;
}

/**
 * Visual transition between major sections.
 * - fade-down: subtle gradient that fades the previous section's edge
 * - fade-up: subtle gradient that preps for the next section
 * - line: thin horizontal rule with gradient opacity
 */
export function SectionDivider({
	variant = "fade-down",
	className,
}: SectionDividerProps): ReactElement {
	if (variant === "line") {
		return (
			<div
				className={`h-px w-full bg-gradient-to-r from-transparent via-border-strong to-transparent ${className ?? ""}`}
				aria-hidden
			/>
		);
	}

	if (variant === "fade-up") {
		return (
			<div
				className={`h-16 w-full bg-gradient-to-b from-transparent to-background ${className ?? ""}`}
				aria-hidden
			/>
		);
	}

	return (
		<div
			className={`h-16 w-full bg-gradient-to-b from-background to-transparent ${className ?? ""}`}
			aria-hidden
		/>
	);
}
