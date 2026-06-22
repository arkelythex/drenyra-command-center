"use client";

import type { ReactElement } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { LANDING_CAPTION_CLASS } from "@/lib/landing/ui-classes";

export function HeroScrollCue(): ReactElement | null {
	const reduceMotion = useReducedMotion();

	if (reduceMotion) {
		return null;
	}

	return (
		<div
			className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
			aria-hidden
		>
			<span className={`text-xs uppercase tracking-[0.28em] ${LANDING_CAPTION_CLASS}`}>
				Scroll
			</span>
			<span className="landing-scroll-cue-bar h-10 w-px bg-foreground/40" />
		</div>
	);
}
