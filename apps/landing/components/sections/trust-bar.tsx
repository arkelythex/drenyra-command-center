"use client";

import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/brand-home";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

function TrustMetric({
	value,
	suffix,
	label,
	index,
}: {
	readonly value: number;
	readonly suffix: string;
	readonly label: string;
	readonly index: number;
}): ReactElement {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-60px" });
	const reduceMotion = useReducedMotion();
	const { count, start, isRunning } = useCountUp({
		end: value,
		duration: 1800,
	});
	const [animationDone, setAnimationDone] = useState(false);

	// Start count-up when in view (in useEffect to avoid side effects in render)
	useEffect(() => {
		if (isInView && !reduceMotion && count === 0) {
			start();
		}
	}, [isInView, reduceMotion, count, start]);

	// Mark animation done once count reaches target
	useEffect(() => {
		if (!animationDone && (reduceMotion || (!isRunning && count >= value))) {
			setAnimationDone(true);
		}
	}, [reduceMotion, isRunning, count, value, animationDone]);

	const displayValue = reduceMotion ? value : count;

	// Format: integers get no decimal, floats keep one decimal
	const formatted =
		Number.isInteger(value) ? String(displayValue) : displayValue.toFixed(1);

	return (
		<ScrollReveal delay={index * 0.1} direction="up">
			<div ref={ref} className="text-center">
				<p
					className="tabular-nums text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-none tracking-[-0.04em] text-foreground"
					role={animationDone ? "status" : "presentation"}
					aria-live={animationDone ? "polite" : "off"}
					aria-label={`${value}${suffix} ${label}`}
				>
					{value >= 100 && !Number.isInteger(value)
						? formatted
						: `${displayValue}${suffix}`}
				</p>
				<p className="mt-3 text-sm text-section-label">{label}</p>
				<p className="mt-1 text-[10px] text-muted-foreground/50">en producción</p>
			</div>
		</ScrollReveal>
	);
}

export function TrustBar(): ReactElement {
	const { trustBar } = BRAND_HOME_COPY;

	return (
		<section
			id="confianza"
			className="scroll-mt-28 py-16 md:py-20"
			aria-label="Métricas de confianza"
		>
			<div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-10">
				<div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12">
					{trustBar.map((metric, index) => (
						<TrustMetric
							key={metric.label}
							value={metric.value}
							suffix={metric.suffix}
							label={metric.label}
							index={index}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
