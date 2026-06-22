"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ECOSYSTEM_COPY } from "@/lib/landing/copy/ecosystem";

function EcosystemTile({
	name,
	tagline,
	description,
	href,
	badge,
	index,
}: {
	readonly name: string;
	readonly tagline: string;
	readonly description: string;
	readonly href: string;
	readonly badge: string | null;
	readonly index: number;
}): ReactElement {
	return (
		<ScrollReveal delay={index * 0.05} direction="scale">
			<Link
				href={href}
				className="group relative flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6 transition-all duration-300 hover:border-foreground/20 hover:bg-foreground/[0.04]"
				aria-label={badge === "roadmap" ? `${name} (próximamente)` : name}
			>
				{/* Hover glow overlay */}
				<div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
					<div className="absolute inset-0 bg-gradient-to-t from-foreground/[0.06] via-transparent to-transparent" />
				</div>

				{/* Label */}
				<div className="relative z-10 flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="text-lg font-medium text-foreground">{name}</span>
						{badge === "roadmap" ? (
							<span className="rounded-full bg-foreground/10 px-2.5 py-0.5 font-medium uppercase tracking-wider text-muted-foreground" style={{ fontSize: "0.625rem" }}>
								Próximamente
							</span>
						) : (
							<ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						)}
					</div>
					<p className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">{tagline}</p>
					<p className="text-sm text-muted-foreground leading-relaxed mt-2">{description}</p>
				</div>

				{/* Bottom glow line on hover */}
				<div className="absolute bottom-0 left-0 right-0 h-[1px] scale-x-0 bg-gradient-to-r from-transparent via-foreground/30 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
			</Link>
		</ScrollReveal>
	);
}

export function EcosystemVisualGrid(): ReactElement {
	const { modules } = ECOSYSTEM_COPY;

	return (
		<section
			id="ecosystem"
			className="scroll-mt-28 border-b landing-border py-16 md:py-24"
			aria-label="Ecosistema"
		>
			<div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-10">
				<ScrollReveal>
					<p className="landing-eyebrow">{ECOSYSTEM_COPY.tagline}</p>
					<h2 className="mt-4 text-[clamp(1.5rem,4vw,3.25rem)] font-semibold leading-tight tracking-[-0.03em]">
						Una plataforma, múltiples herramientas.
					</h2>
				</ScrollReveal>

				<div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
					{modules.map((item, index) => (
						<EcosystemTile
							key={item.name}
							name={item.name}
							tagline={item.tagline}
							description={item.description}
							href={item.href}
							badge={item.badge}
							index={index}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
