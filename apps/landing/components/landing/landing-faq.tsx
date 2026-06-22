"use client";

import type { ReactElement } from "react";
import { Plus } from "lucide-react";

import { LANDING_FAQS } from "@/lib/data/landing-faqs";
import {
	LANDING_BODY_MUTED_CLASS,
	LANDING_DIVIDER_CLASS,
	LANDING_EYEBROW_CLASS,
} from "@/lib/landing/ui-classes";
import { cn } from "@/lib/utils";

export function LandingFaq(): ReactElement {
	return (
		<section
			id="faq"
			className={`scroll-mt-28 ${LANDING_DIVIDER_CLASS} py-20 md:py-28`}
			aria-labelledby="faq-title"
		>
			<div className="mx-auto grid w-full max-w-6xl gap-12 px-6 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20 lg:px-10">
				<div className="lg:sticky lg:top-32 lg:self-start">
					<h2 id="faq-title" className={LANDING_EYEBROW_CLASS}>
						FAQ
					</h2>
					<p className="mt-4 text-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
						Preguntas frecuentes
					</p>
				</div>
				<ul className={`divide-y landing-border ${LANDING_DIVIDER_CLASS}`}>
					{LANDING_FAQS.map((item) => (
						<li key={item.question}>
							<details className="group py-6">
								<summary
									className={cn(
										"flex cursor-pointer list-none items-start justify-between gap-4",
										"text-base font-medium text-foreground marker:hidden",
										"[&::-webkit-details-marker]:hidden",
									)}
								>
									<span className="min-w-0">{item.question}</span>
									<Plus
										className="mt-0.5 h-5 w-5 shrink-0 text-section-label transition-transform duration-300 group-open:rotate-45"
										aria-hidden
									/>
								</summary>
								<p className={`mt-4 max-w-prose text-sm ${LANDING_BODY_MUTED_CLASS}`}>
									{item.answer}
								</p>
							</details>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
