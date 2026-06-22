"use client";

import type { ReactElement } from "react";
import Link from "next/link";

import { ECOSYSTEM_NAV_LINKS } from "@/lib/landing/ecosystem-nav";
import {
	LANDING_BODY_MUTED_CLASS,
	LANDING_EYEBROW_CLASS,
} from "@/lib/landing/ui-classes";
import { cn } from "@/lib/utils";

/**
 * Descubrimiento del ecosistema en páginas internas — monocromo, sin competir con la home visual-first.
 */
export function EcosystemRail(): ReactElement {
	return (
		<div
			className="mb-14 border-b landing-border pb-14 md:mb-16 md:pb-16"
			aria-labelledby="ecosystem-rail-title"
		>
			<p id="ecosystem-rail-title" className={LANDING_EYEBROW_CLASS}>
				Ecosistema
			</p>
			<p className={`mt-3 max-w-2xl text-sm ${LANDING_BODY_MUTED_CLASS}`}>
				Arkelythex es la capa de confianza; Drenyra es el command center; el resto son
				módulos y capacidades sobre la misma plataforma.
			</p>
			<ul className="mt-6 flex flex-wrap gap-2">
				{ECOSYSTEM_NAV_LINKS.map((link) => (
					<li key={link.href}>
						<Link
							href={link.href}
							className={cn(
								"inline-flex min-h-9 items-center gap-2 rounded-lg border landing-border px-3 py-1.5",
								"text-sm font-medium text-foreground/90 transition-colors",
								"hover:border-foreground/25 hover:bg-foreground/5",
							)}
						>
							{link.name}
							{link.roadmap ? (
								<span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">
									Roadmap
								</span>
							) : null}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
