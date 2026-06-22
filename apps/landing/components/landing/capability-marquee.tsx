"use client";

import type { ReactElement } from "react";

import { V2_LANDING_COPY } from "@/lib/constants/copy";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { LANDING_BODY_MUTED_CLASS } from "@/lib/landing/ui-classes";

export function CapabilityMarquee(): ReactElement {
	const { trust } = V2_LANDING_COPY;
	const reduceMotion = useReducedMotion();
	const items = [...trust.items, ...trust.items];

	return (
		<section
			className="border-b landing-border py-10 md:py-12"
			aria-label="Ámbitos de control fiscal"
		>
			<div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
				<p className={`max-w-2xl text-sm md:text-base ${LANDING_BODY_MUTED_CLASS}`}>
					{trust.subtitle}
				</p>
			</div>
			<div
				className="landing-marquee-mask relative mt-8 overflow-hidden"
				aria-hidden={reduceMotion}
			>
				<ul
					className={
						reduceMotion
							? "flex flex-wrap justify-center gap-x-6 gap-y-2 px-6"
							: "landing-marquee-track flex w-max gap-10 px-6"
					}
				>
					{(reduceMotion ? trust.items : items).map((item, index) => (
						<li
							key={`${item}-${index}`}
							className="landing-eyebrow shrink-0"
						>
							{item}
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
