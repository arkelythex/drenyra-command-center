"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { LANDING_CAPTION_CLASS } from "@/lib/landing/ui-classes";

const THOUGHT_MS = [412, 847, 1203, 634] as const;
const THOUGHT_ROTATE_MS = 2400;

/** “Thought for X ms” — Codex-style agent latency indicator. */
export function DrenyraThoughtPulse(): ReactElement {
	const reduceMotion = useReducedMotion();
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (reduceMotion) return;
		const timer = setInterval(() => {
			setIndex((prev) => (prev + 1) % THOUGHT_MS.length);
		}, THOUGHT_ROTATE_MS);
		return () => clearInterval(timer);
	}, [reduceMotion]);

	const ms = THOUGHT_MS[index] ?? THOUGHT_MS[0];

	return (
		<p
			className={`drenyra-thought-pulse font-mono ${LANDING_CAPTION_CLASS} drenyra-text-accent`}
			aria-live="polite"
		>
			Thought for {ms} ms
		</p>
	);
}
